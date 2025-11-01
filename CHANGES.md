# Simplified YAML Structure - Changes Documentation

## Overview

The YAML configuration format has been simplified to make it more intuitive and easier to write. The main changes merge parameters and constraints into a single `values` section, and remove the need for explicit `flows.` and `parameters.` prefixes.

## What Changed

### Before (Old Format)

```yaml
parameters:
    total_energy: 1000
    loss_rate: 0.15

nodes:
    - id: source
    - id: sink

flows:
    - id: flow1
      from: source
      to: sink

constraints:
    - "flows.flow1 == parameters.total_energy * (1 - parameters.loss_rate)"
```

### After (New Format)

```yaml
values:
    # Parameters
    total_energy: 1000
    loss_rate: 0.15
    
    # Flow formulas
    flow1: total_energy * (1 - loss_rate)

nodes:
    - id: source
    - id: sink

flows:
    - id: flow1
      from: source
      to: sink
```

## Key Improvements

1. **Single `values` section**: Parameters and flow formulas are now defined in one place
2. **No prefixes needed**: Reference other values directly by their slug name (e.g., `total_energy` instead of `parameters.total_energy`)
3. **Cleaner syntax**: Flow formulas are simple assignments rather than equation strings
4. **Unique slugs**: All IDs (nodes and flows) must be unique, eliminating ambiguity

## Technical Details

### How the Parser Works

The new parser (`src/parser.js`) automatically:

1. **Separates values into parameters and flows** based on whether the slug appears in the `flows` list
2. **Detects value types**:
   - Numbers can be either parameters or flow values
   - Strings are always flow formulas
3. **Adds prefixes automatically**: Converts `flow1: total * 0.5` to `flows.flow1 == parameters.total * 0.5`
4. **Handles formula references**: Automatically determines whether identifiers in formulas refer to flows or parameters

### Slug Resolution Rules

When you write a formula like `flow1: input * rate`, the parser:

1. Checks if `input` is a flow ID → adds `flows.` prefix
2. Checks if `input` is in the values section → adds `parameters.` prefix
3. If not found, assumes it's a parameter (allows forward references)

The same logic applies to `rate`.

## Migration Guide

### Converting Old YAML Files

**Old format:**
```yaml
parameters:
    x: 10
    y: 20

constraints:
    - "flows.result == parameters.x + parameters.y"
```

**New format:**
```yaml
values:
    x: 10
    y: 20
    result: x + y
```

### Common Patterns

#### 1. Simple constant values

**Old:**
```yaml
parameters:
    total: 100

constraints:
    - "flows.main == parameters.total"
```

**New:**
```yaml
values:
    total: 100
    main: total
```

#### 2. Flow depending on another flow

**Old:**
```yaml
constraints:
    - "flows.input == 100"
    - "flows.output == flows.input * 0.9"
```

**New:**
```yaml
values:
    input: 100
    output: input * 0.9
```

#### 3. Complex expressions

**Old:**
```yaml
parameters:
    base: 1000
    rate: 0.15
    boost: 50

constraints:
    - "flows.result == parameters.base * (1 - parameters.rate) + parameters.boost"
```

**New:**
```yaml
values:
    base: 1000
    rate: 0.15
    boost: 50
    result: base * (1 - rate) + boost
```

## Backward Compatibility

The internal solver API still uses the old format with `parameters` and `constraints`. The new parser (`parseSimplifiedYaml`) converts the simplified YAML to the internal format automatically.

If you're using the solver programmatically, you can:

1. **Use the simplified format** (recommended):
   ```javascript
   import { parseSimplifiedYaml } from './src/parser.js';
   import { solve } from './src/solver.js';
   
   const config = parseSimplifiedYaml(yamlData);
   const result = solve(config);
   ```

2. **Use the internal format directly** (if needed):
   ```javascript
   import { solve } from './src/solver.js';
   
   const result = solve({
       parameters: { x: 10 },
       nodes: [...],
       flows: [...],
       constraints: ['flows.f1 == parameters.x']
   });
   ```

## Files Changed

### New Files
- `src/parser.js` - Parser for simplified YAML format
- `src/parser.test.js` - Tests for the parser (25 test cases)
- `example_simple.yaml` - Minimal example using new format
- `CHANGES.md` - This file

### Modified Files
- `sankey-solver.js` - Updated CLI to use parser
- `src/ui/App.jsx` - Updated web UI to use parser
- `watch.js` - Updated watch mode to use parser
- `example.yaml` - Updated to use simplified format
- `example_orig.yaml` - Updated to use simplified format
- `README.md` - Updated documentation with new examples

### Unchanged
- `src/solver.js` - Core solver logic unchanged
- `src/expressions.js` - Expression evaluation unchanged
- `src/balance.js` - Balance solving unchanged
- `src/verification.js` - Verification logic unchanged
- All existing tests continue to pass (165 tests)

## Examples

See the following files for complete examples:
- `example_simple.yaml` - Minimal 3-node example
- `example_orig.yaml` - Power distribution network
- `example.yaml` - Train cost analysis (Sleeper train model)

## Notes

- Slugs (IDs) must be unique across both nodes and flows
- Formula expressions support: `+`, `-`, `*`, `/`, `(`, `)`
- Formulas are evaluated using JavaScript's `eval()` (security consideration for production use)
- The parser automatically handles already-prefixed formulas (e.g., `parameters.x` is left unchanged)