# Sankey Solver - Module Documentation

This directory contains the modular components of the Sankey flow solver.

## Module Structure

### `solver.js` - Main Solver
The primary entry point for solving Sankey flow systems.

**Exports:**
- `solve(config)` - Main solving function that orchestrates the entire solving process

**Usage:**
```javascript
import { solve } from './solver.js';

const result = solve({
  parameters: { total: 100 },
  nodes: [{ id: 'A' }, { id: 'B' }],
  flows: [{ id: 'f1', from: 'A', to: 'B' }],
  constraints: ['flows.f1 == parameters.total']
});
```

### `expressions.js` - Expression Evaluation
Handles parsing and evaluating mathematical expressions with parameter and flow substitutions.

**Exports:**
- `evaluateExpression(expr, parameters, definedFlows)` - Evaluates a single expression
- `parseConstraint(constraint)` - Parses constraint into left/right expressions
- `evaluateConstraint(constraint, parameters, definedFlows)` - Evaluates one constraint
- `evaluateAllConstraints(constraints, parameters)` - Evaluates all constraints sequentially

**Example:**
```javascript
import { evaluateExpression } from './expressions.js';

const result = evaluateExpression(
  'parameters.x + flows.y * 2',
  { x: 10 },
  { y: 5 }
); // Returns 20
```

### `balance.js` - Node Balance Solving
Contains the core logic for solving flows using node balance constraints (sum of inputs = sum of outputs).

**Exports:**
- `getNodeFlows(node, flows)` - Gets input/output flows for a node
- `isSourceOrSink(inputs, outputs)` - Checks if node is a source or sink
- `getUndefinedFlows(flows, definedFlows)` - Filters undefined flows
- `sumDefinedFlows(flows, definedFlows)` - Sums defined flow values
- `solveNodeBalance(node, flows, definedFlows)` - Attempts to solve one node
- `solveIteration(nodes, flows, definedFlows)` - One solving iteration
- `solveIteratively(nodes, flows, definedFlows, maxIterations)` - Iterative solver

**Example:**
```javascript
import { solveNodeBalance } from './balance.js';

const solution = solveNodeBalance(
  { id: 'node1' },
  allFlows,
  currentDefinedFlows
); // Returns { flowId: 'f1', value: 42 } or null
```

### `verification.js` - Solution Verification
Validates that solutions satisfy all balance constraints.

**Exports:**
- `verifyNodeBalance(node, flows, definedFlows)` - Verifies one node's balance
- `verifyBalance(nodes, flows, definedFlows)` - Verifies all nodes
- `isFullySolved(flows, definedFlows)` - Checks if all flows are defined
- `getUndeterminedFlowIds(flows, definedFlows)` - Gets list of undefined flow IDs

**Example:**
```javascript
import { verifyBalance } from './verification.js';

const errors = verifyBalance(nodes, flows, solution);
if (errors.length > 0) {
  console.log('Balance violations found:', errors);
}
```

### `formatter.js` - Output Formatting
Formats solver results for display.

**Exports:**
- `formatFlowList(flows)` - Formats flow values as list
- `formatBalanceErrors(errors)` - Formats balance error details
- `formatSuccess(result)` - Formats successful result
- `formatUnderdetermined(result)` - Formats underdetermined system error
- `formatContradictory(result)` - Formats contradictory constraints error
- `formatResult(result)` - Main formatter that dispatches to appropriate formatter

**Example:**
```javascript
import { formatResult } from './formatter.js';

const output = formatResult(solveResult);
console.log(output);
```

## Testing Strategy

Each module can be tested independently:

1. **expressions.js** - Test expression parsing and evaluation with various parameter/flow combinations
2. **balance.js** - Test node balance solving with different graph topologies
3. **verification.js** - Test balance verification with valid and invalid solutions
4. **formatter.js** - Test output formatting for all result types
5. **solver.js** - Integration tests with complete system configurations

## Design Principles

- **Single Responsibility**: Each module has one clear purpose
- **Pure Functions**: Most functions are pure with no side effects (except file I/O in CLI)
- **Testability**: Functions are small and easily testable in isolation
- **Composability**: Modules build on each other in a clear hierarchy
- **Documentation**: Each function includes JSDoc comments

## Dependencies Between Modules

```
solver.js
  ├── expressions.js
  ├── balance.js
  └── verification.js
      └── balance.js (for helper functions)

formatter.js (independent, no dependencies)
```
