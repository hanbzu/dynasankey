# Dynasankey: Dynamic Sankey Diagram Builder

A lightweight web tool for creating Sankey diagrams with dynamic formulas and automatic flow calculation. Define your flows and values, and let the constraint solver figure out the rest.

Available at https://hanbzu.github.io/dynasankey/

## What are Sankey diagrams?

Sankey diagrams visualize flows through a system, where the width of each connection represents the magnitude of the flow. They're commonly used for:

- **Financial flows**: Budget breakdowns, cost allocation, revenue streams
- **Energy systems**: Power generation and consumption, resource flows
- **Material flows**: Supply chains, manufacturing processes, waste streams
- **Data flows**: Traffic patterns, user journeys, information movement

## How it works

**1. Define your values**

Values can be simple numbers or dynamic formulas that reference other values:

```
seats = 350
occupancy = 0.7
tickets = avg_ticket_price * seats * occupancy
```

**2. Define your flows**

Flows connect nodes in your diagram. Each flow needs a source (from) and/or destination (to):

```
tickets → revenue
subsidy → revenue
cost: revenue → expenses
```

**3. Let the solver fill in the gaps**

The constraint solver automatically calculates undefined flow values using conservation principles: at each node, the sum of incoming flows equals the sum of outgoing flows. You only need to define enough values to make the system solvable—the rest are computed automatically.

For example, if `revenue` has two incoming flows and two outgoing flows, and you've defined three of them, the fourth is calculated automatically to balance the node.

**4. Get an interactive diagram**

The tool renders your flows as an interactive Sankey diagram with node labels and calculated values displayed automatically.

## Key features

- **Dynamic formulas**: Values can reference other values using simple JavaScript expressions
- **Automatic solving**: Missing flow values are calculated using node balance equations
- **URL state**: Your entire diagram is stored in the URL for easy sharing
- **Responsive**: Diagrams adapt to your screen size
- **No installation**: Runs entirely in your browser

## Development

```bash
yarn install
yarn dev
```

Build for production:

```bash
yarn build
```
