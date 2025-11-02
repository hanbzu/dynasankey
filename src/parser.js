// ============================================================================
// YAML Parser - Converts simplified YAML to solver format
// ============================================================================

/**
 * Parses the simplified YAML structure and converts it to the format
 * expected by the solver.
 *
 * Simplified format:
 * - values: contains both parameters and flow formulas (no prefixes needed)
 * - nodes: same as before
 * - flows: same as before
 *
 * Solver format:
 * - parameters: numeric values only
 * - nodes: same
 * - flows: same
 * - constraints: array of equation strings with flows.* prefix
 *
 * @param {Object} yaml - Parsed YAML object with simplified structure
 * @returns {Object} Config object in solver format
 */
export const parseSimplifiedYaml = (yaml) => {
    const { values = {}, nodes = [], flows = [] } = yaml;

    // Create a set of flow IDs for quick lookup
    const flowIds = new Set(flows.map((f) => f.id));

    // Separate values into parameters (numbers) and flow formulas (expressions)
    const parameters = {};
    const flowFormulas = {};

    for (const [key, value] of Object.entries(values)) {
        if (typeof value === "number") {
            // Numeric value - could be either a parameter or a flow
            if (flowIds.has(key)) {
                // It's a flow value
                flowFormulas[key] = value;
            } else {
                // It's a parameter
                parameters[key] = value;
            }
        } else if (typeof value === "string") {
            // String expression - must be a flow formula
            flowFormulas[key] = value;
        } else {
            throw new Error(`Invalid value type for '${key}': ${typeof value}`);
        }
    }

    // Convert flow formulas to constraint strings
    const constraints = Object.entries(flowFormulas).map(
        ([flowId, formula]) => {
            if (typeof formula === "number") {
                return `flows.${flowId} == ${formula}`;
            } else {
                // It's a string expression - add prefixes
                const prefixedFormula = addPrefixes(
                    formula,
                    parameters,
                    flowIds,
                );
                return `flows.${flowId} == ${prefixedFormula}`;
            }
        },
    );

    // Sort constraints by dependency order (topological sort)
    const sortedConstraints = topologicalSortConstraints(constraints);

    return {
        parameters,
        nodes,
        flows,
        constraints: sortedConstraints,
    };
};

/**
 * Adds 'parameters.' or 'flows.' prefixes to identifiers in a formula.
 *
 * @param {string} formula - The formula string (e.g., "distance * cost_per_km")
 * @param {Object} parameters - Map of parameter names
 * @param {Set} flowIds - Set of flow IDs
 * @returns {string} Formula with prefixes (e.g., "parameters.distance * parameters.cost_per_km")
 */
const addPrefixes = (formula, parameters, flowIds) => {
    // First, skip if formula already contains prefixes
    if (formula.includes("parameters.") || formula.includes("flows.")) {
        return formula;
    }

    // Match all identifiers (alphanumeric + underscore, not starting with a digit)
    return formula.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
        // Check if it's a flow
        if (flowIds.has(match)) {
            return `flows.${match}`;
        }

        // Check if it's a parameter
        if (parameters.hasOwnProperty(match)) {
            return `parameters.${match}`;
        }

        // If not found in either, assume it's a parameter that will be defined
        // (this allows forward references in some cases)
        return `parameters.${match}`;
    });
};

/**
 * Validates that the simplified YAML has all required fields.
 *
 * @param {Object} yaml - Parsed YAML object
 * @throws {Error} If validation fails
 */
export const validateSimplifiedYaml = (yaml) => {
    if (!yaml || typeof yaml !== "object" || Array.isArray(yaml)) {
        throw new Error("YAML must be an object");
    }

    if (!yaml.nodes || !Array.isArray(yaml.nodes)) {
        throw new Error('YAML must contain a "nodes" array');
    }

    if (!yaml.flows || !Array.isArray(yaml.flows)) {
        throw new Error('YAML must contain a "flows" array');
    }

    if (!yaml.values || typeof yaml.values !== "object") {
        throw new Error('YAML must contain a "values" object');
    }

    // Validate nodes have required fields
    for (const node of yaml.nodes) {
        if (!node.id) {
            throw new Error('Each node must have an "id" field');
        }
    }

    // Validate flows have required fields
    for (const flow of yaml.flows) {
        if (!flow.id) {
            throw new Error('Each flow must have an "id" field');
        }
        if (!flow.from) {
            throw new Error(`Flow "${flow.id}" must have a "from" field`);
        }
        if (!flow.to) {
            throw new Error(`Flow "${flow.id}" must have a "to" field`);
        }
    }
};

/**
 * Extracts the flow ID from the left side of a constraint.
 * @param {string} constraint - Constraint string (e.g., "flows.x == ...")
 * @returns {string|null} Flow ID or null if not found
 */
const extractFlowId = (constraint) => {
    const match = constraint.match(/^flows\.(\w+)\s*==/);
    return match ? match[1] : null;
};

/**
 * Extracts all flow IDs referenced in the right side of a constraint.
 * @param {string} constraint - Constraint string
 * @returns {Array<string>} Array of flow IDs referenced
 */
const extractDependencies = (constraint) => {
    const rightSide = constraint.split("==")[1] || "";
    const matches = rightSide.matchAll(/flows\.(\w+)/g);
    return Array.from(matches, (m) => m[1]);
};

/**
 * Topologically sorts constraints so that dependencies are evaluated first.
 * Uses Kahn's algorithm for topological sorting.
 * @param {Array<string>} constraints - Array of constraint strings
 * @returns {Array<string>} Sorted constraints
 */
const topologicalSortConstraints = (constraints) => {
    // Build dependency graph
    const graph = new Map(); // flowId -> constraint string
    const dependencies = new Map(); // flowId -> Set of flowIds it depends on
    const dependents = new Map(); // flowId -> Set of flowIds that depend on it

    // Initialize maps
    for (const constraint of constraints) {
        const flowId = extractFlowId(constraint);
        if (flowId) {
            graph.set(flowId, constraint);
            dependencies.set(flowId, new Set(extractDependencies(constraint)));
            dependents.set(flowId, new Set());
        }
    }

    // Build dependent relationships
    for (const [flowId, deps] of dependencies.entries()) {
        for (const dep of deps) {
            if (dependents.has(dep)) {
                dependents.get(dep).add(flowId);
            }
        }
    }

    // Kahn's algorithm
    const sorted = [];
    const queue = [];

    // Find nodes with no dependencies
    for (const [flowId, deps] of dependencies.entries()) {
        if (deps.size === 0) {
            queue.push(flowId);
        }
    }

    while (queue.length > 0) {
        const flowId = queue.shift();
        sorted.push(graph.get(flowId));

        // Remove this node from its dependents' dependency lists
        const deps = dependents.get(flowId) || new Set();
        for (const dependent of deps) {
            const depSet = dependencies.get(dependent);
            depSet.delete(flowId);

            // If dependent now has no dependencies, add to queue
            if (depSet.size === 0) {
                queue.push(dependent);
            }
        }
    }

    // Check for cycles
    if (sorted.length !== constraints.length) {
        // There's a cycle - just return original order and let solver handle it
        return constraints;
    }

    return sorted;
};
