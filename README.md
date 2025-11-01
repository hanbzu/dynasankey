# Sankey Diagram Solver

A web application and CLI tool that solves Sankey flow diagrams using constraint satisfaction. Define your network topology and flow values in a simplified YAML format, and the solver determines all remaining flow values automatically using node balance equations.

**Key Feature:** Uses a simplified YAML structure where you define all values (both parameters and flow formulas) in one place, without needing prefixes like `flows.` or `parameters.`.

## Quick Start

```bash
# Install dependencies
npm install

# Start web UI
npm run dev

# Or use CLI
node sankey-solver.js example.yaml

# Run tests
npm test

# Build for production
npm run build
```

## Usage

### Web UI

The web interface provides an easy way to upload YAML files and see results:

1. Start the development server: `npm run dev`
2. Open your browser to `http://localhost:5173`
3. Upload a YAML configuration file
4. View the solver results instantly

The web UI displays the same formatted output as the CLI, color-coded for success (green) or errors (red).

**Deploy to GitHub Pages:**
```bash
npm run deploy
```

### CLI

Use the command-line interface for automation and scripting:

```bash
node sankey-solver.js example.yaml
```

## What It Does

The solver takes a simplified YAML definition of:
- **Values** (parameters and flow formulas in one section)
- **Nodes** (sources, sinks, and intermediate points)
- **Flows** (directed edges between nodes)

It then:
1. Evaluates flow formulas to get initial flow values
2. Iteratively applies node balance (sum of inputs = sum of outputs)
3. Solves for all remaining flows or reports which flows are underdetermined

## YAML Configuration

The YAML configuration uses a simplified structure where:
- **values**: Contains both parameters (constants) and flow formulas in one place
- **nodes**: Defines the nodes in your diagram
- **flows**: Defines the directed edges between nodes

Slugs (IDs) must be unique across both nodes and flows, so you can reference them directly without prefixes like `flows.` or `parameters.`.

### Minimal Example

```yaml
values:
  total: 100
  flow1: total

nodes:
  - id: source
  - id: sink

flows:
  - id: flow1
    from: source
    to: sink
```

### Complete Example (Power Distribution)

```yaml
values:
  # Input parameters
  total_energy: 1000
  residential_demand: 400
  loss_rate: 0.15
  
  # Flow formulas
  src_trans: total_energy
  trans_res: residential_demand
  trans_loss: src_trans * loss_rate
  # trans_ind will be solved via balance constraint at transmission node

nodes:
  - id: source
    label: "Power Plant"
  - id: transmission
    label: "Transmission Lines"
  - id: residential
    label: "Residential"
  - id: industrial
    label: "Industrial"
  - id: losses
    label: "Line Losses"

flows:
  - id: src_trans
    from: source
    to: transmission
    label: "Generated Power"
  - id: trans_res
    from: transmission
    to: residential
    label: "To Homes"
  - id: trans_ind
    from: transmission
    to: industrial
    label: "To Industry"
  - id: trans_loss
    from: transmission
    to: losses
    label: "Line Losses"
```

**Output:**
```
✓ System is solvable

Flow values:
  src_trans: 1000
  trans_res: 400
  trans_loss: 150
  trans_ind: 450
```

## Values Syntax

The `values` section contains both constants and formulas. Each entry can be:
- A **number**: A constant value (can be a parameter or a fixed flow value)
- A **formula**: An expression referencing other values

```yaml
values:
  # Constants
  total: 100
  loss_rate: 0.15
  boost: 10
  
  # Simple references
  flow1: total
  
  # Arithmetic expressions
  flow2: flow1 * 0.5
  flow3: (flow1 + flow2) / 2
  
  # Using parameters in formulas
  loss: input * loss_rate
  output: input * (1 - loss_rate) + boost
```

**Supported operators:** `+`, `-`, `*`, `/`, `(`, `)`

**Note:** The solver automatically detects whether a slug refers to a flow or a parameter based on your `flows` definitions.

## Output Examples

### ✓ Solvable System
```
✓ System is solvable

Flow values:
  flow1: 100
  flow2: 50
  flow3: 50
```

### ✗ Underdetermined System
```
✗ Underdetermined system

Defined flows:
  flow1: 100

Undetermined flows:
  flow2
  flow3

Need 2 more constraint(s).
```

### ✗ Contradictory Constraints
```
✗ Contradictory constraints

Balance violations:
  Node 'transmission':
    Inputs: 1000
    Outputs: 1100
    Difference: -100
```

## How the Algorithm Works

1. **Evaluate explicit constraints** - Process all constraint equations in order
2. **Iterative balance solving** - For each node:
   - Skip sources (no inputs) and sinks (no outputs)
   - If exactly one flow is undefined, solve using: `sum(inputs) = sum(outputs)`
   - Repeat until no more progress
3. **Verify solution** - Check if all flows are defined and balanced

**Key insight:** The algorithm can solve many flows automatically using only node balance, requiring explicit constraints only where the topology is underdetermined.

## Programmatic Usage

### Using Simplified YAML

```javascript
import yaml from 'js-yaml';
import { parseSimplifiedYaml, validateSimplifiedYaml } from './src/parser.js';
import { solve } from './src/solver.js';

const yamlString = `
values:
  total: 100
  ab: total

nodes:
  - id: A
  - id: B

flows:
  - id: ab
    from: A
    to: B
`;

const yamlData = yaml.load(yamlString);
validateSimplifiedYaml(yamlData);
const config = parseSimplifiedYaml(yamlData);
const result = solve(config);

if (result.success) {
  console.log(result.flows); // { ab: 100 }
} else {
  console.log(result.error); // "Underdetermined system"
  console.log(result.undeterminedFlows); // ["flow2", "flow3"]
}
```

### Using Internal Format Directly

If you prefer to work with the internal format directly (without parsing YAML):

```javascript
import { solve } from './src/solver.js';

const result = solve({
  parameters: { total: 100 },
  nodes: [{ id: 'A' }, { id: 'B' }],
  flows: [{ id: 'ab', from: 'A', to: 'B' }],
  constraints: ['flows.ab == parameters.total']
});

if (result.success) {
  console.log(result.flows); // { ab: 100 }
} else {
  console.log(result.error);
}
```

### Using Individual Modules

```javascript
import { evaluateExpression } from './src/expressions.js';
import { solveNodeBalance } from './src/balance.js';
import { verifyBalance } from './src/verification.js';
import { formatResult } from './src/formatter.js';
import { solve } from './src/solver.js';
```

## Project Structure

```
nightmodel/
├── sankey-solver.js       # CLI entry point (26 lines)
├── src/
│   ├── solver.js          # Main orchestration (99 lines)
│   ├── expressions.js     # Expression evaluation (102 lines)
│   ├── balance.js         # Node balance solving (138 lines)
│   ├── verification.js    # Solution verification (83 lines)
│   ├── formatter.js       # Output formatting (99 lines)
│   ├── ui/
│   │   ├── App.jsx        # React web interface
│   │   └── main.jsx       # React entry point
│   └── *.test.js          # Test files (140 tests)
├── index.html             # Web UI HTML entry point
├── vite.config.js         # Vite/Vitest configuration
└── example.yaml           # Example diagram
```</system_warning>

The codebase is modularized for testability and maintainability. Each module has a single responsibility and comprehensive test coverage.

## Testing

This project has **140 tests** covering all modules:

```bash
# Watch mode (recommended for development)
npm test

# Run all tests once
npm run test:run

# Interactive browser UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- `expressions.test.js` - 28 tests for expression evaluation
- `balance.test.js` - 35 tests for node balance solving
- `verification.test.js` - 30 tests for solution verification
- `formatter.test.js` - 26 tests for output formatting
- `solver.test.js` - 21 integration tests

All tests run in ~150ms. See [TESTING.md](TESTING.md) for detailed testing guide.

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { evaluateExpression } from './src/expressions.js';

describe('evaluateExpression', () => {
  it('should evaluate parameter substitution', () => {
    const result = evaluateExpression('parameters.x + 10', { x: 5 }, {});
    expect(result).toBe(15);
  });
});
```

## Development Workflow

1. **Start watch mode:** `npm test`
2. **Edit code** in `src/` directory
3. **Tests auto-run** on file save
4. **Fix failures** and repeat
5. **Final check:** `npm run test:run`

## Common Use Cases

- Energy Distribution: Model power grids with generation sources, transmission losses, and consumption endpoints.
- Supply Chain: Track material flows through manufacturing processes with waste and byproducts.
- Financial Flows: Represent budget allocation, cost centers, and spending categories.
- Network Traffic: Model data flows through network nodes with bandwidth constraints.
- Water Systems: Simulate water distribution with pumping stations, storage, and consumption.

## Limitations & Notes

- **Acyclic graphs only** - No flow cycles allowed
- **Source/sink nodes** - Automatically skip balance checks for nodes with no inputs or outputs
- **Expression evaluation** - Currently uses `eval()` (consider replacing with safe parser in production)
- **Iteration limit** - Prevents infinite loops (though algorithm should always terminate)

## Documentation

- **[TESTING.md](TESTING.md)** - Comprehensive testing guide (470 lines)
- **[REFACTORING.md](REFACTORING.md)** - Architecture and design decisions (280 lines)
- **[SUMMARY.md](SUMMARY.md)** - Complete project overview (364 lines)
- **[src/README.md](src/README.md)** - Module-level API documentation (220 lines)

## Tips & Tricks

### Debugging Failed Solves

If the system is underdetermined:
1. Check which flows are listed as undetermined
2. Add explicit constraints for those flows
3. Verify your graph topology is correct

If you get contradictory constraints:
1. Check the balance violation details
2. Verify your constraint equations are correct
3. Ensure parameters have correct values

### Performance

For large graphs:
- The solver runs in O(n*m) where n=nodes, m=flows
- Typically solves in milliseconds
- Consider caching if solving repeatedly with same topology

### Best Practices

1. **Use descriptive IDs** - Makes debugging easier
2. **Add labels** - Helps document your model
3. **Group related parameters** - Organize by subsystem
4. **Test incrementally** - Start simple, add complexity
5. **Validate input data** - Check YAML syntax before running

## Contributing

When adding new features:
1. ✅ Write tests first (TDD approach)
2. ✅ Ensure all tests pass: `npm run test:run`
3. ✅ Maintain or improve coverage: `npm run test:coverage`
4. ✅ Update documentation

## Statistics

- **Lines of Code:** ~521 (excluding tests)
- **Test Coverage:** 140 tests, all passing
- **Test Execution:** ~150ms for full suite
- **Modules:** 5 focused modules with clear responsibilities
- **Dependencies:** js-yaml (runtime), vite + vitest (dev)

## License

MIT

---

**Version:** 1.0.0
**Status:** ✅ Production Ready with Comprehensive Tests
