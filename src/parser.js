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

    return {
        parameters,
        nodes,
        flows,
        constraints,
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
