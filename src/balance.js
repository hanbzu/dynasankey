// ============================================================================
// Node Balance Solving
// ============================================================================

/**
 * Gets all input and output flows for a given node.
 * @param {Object} node - The node to analyze
 * @param {Array<Object>} flows - All flows in the system
 * @returns {Object} Object with inputs and outputs arrays
 */
export const getNodeFlows = (node, flows) => {
    const inputs = flows.filter((f) => f.to === node.id);
    const outputs = flows.filter((f) => f.from === node.id);
    return { inputs, outputs };
};

/**
 * Checks if a node is a source (no inputs) or sink (no outputs).
 * @param {Array<Object>} inputs - Input flows
 * @param {Array<Object>} outputs - Output flows
 * @returns {boolean} True if node is a source or sink
 */
export const isSourceOrSink = (inputs, outputs) => {
    return inputs.length === 0 || outputs.length === 0;
};

/**
 * Filters flows to return only those that are not yet defined.
 * @param {Array<Object>} flows - Flows to filter
 * @param {Object} definedFlows - Currently defined flow values
 * @returns {Array<Object>} Flows that don't have values yet
 */
export const getUndefinedFlows = (flows, definedFlows) => {
    return flows.filter((f) => definedFlows[f.id] === undefined);
};

/**
 * Sums the values of all defined flows in the given list.
 * @param {Array<Object>} flows - Flows to sum
 * @param {Object} definedFlows - Flow values
 * @returns {number} Sum of defined flow values
 */
export const sumDefinedFlows = (flows, definedFlows) => {
    return flows
        .filter((f) => definedFlows[f.id] !== undefined)
        .reduce((sum, f) => sum + definedFlows[f.id], 0);
};

/**
 * Attempts to solve for one unknown flow using node balance constraint.
 * Balance constraint: sum(inputs) = sum(outputs)
 * Can only solve when exactly one flow is undefined.
 *
 * @param {Object} node - The node to analyze
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Currently defined flow values
 * @returns {Object|null} Solution object {flowId, value} or null if cannot solve
 */
export const solveNodeBalance = (node, flows, definedFlows) => {
    const { inputs, outputs } = getNodeFlows(node, flows);

    // Skip source and sink nodes
    if (isSourceOrSink(inputs, outputs)) {
        return null;
    }

    const undefinedInputs = getUndefinedFlows(inputs, definedFlows);
    const undefinedOutputs = getUndefinedFlows(outputs, definedFlows);
    const totalUndefined = undefinedInputs.length + undefinedOutputs.length;

    // Can only solve if exactly 1 flow is undefined
    if (totalUndefined !== 1) {
        return null;
    }

    const sumInputs = sumDefinedFlows(inputs, definedFlows);
    const sumOutputs = sumDefinedFlows(outputs, definedFlows);

    if (undefinedInputs.length === 1) {
        // Solve for undefined input: input = sum(outputs) - sum(other inputs)
        const flowId = undefinedInputs[0].id;
        return { flowId, value: sumOutputs - sumInputs };
    } else {
        // Solve for undefined output: output = sum(inputs) - sum(other outputs)
        const flowId = undefinedOutputs[0].id;
        return { flowId, value: sumInputs - sumOutputs };
    }
};

/**
 * Performs one iteration of solving, attempting to solve all solvable nodes.
 * @param {Array<Object>} nodes - All nodes in the system
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Currently defined flow values
 * @returns {Object} Object with updated definedFlows and changed flag
 */
export const solveIteration = (nodes, flows, definedFlows) => {
    const solutions = nodes
        .map((node) => solveNodeBalance(node, flows, definedFlows))
        .filter((solution) => solution !== null);

    if (solutions.length === 0) {
        return { definedFlows, changed: false };
    }

    const newDefinedFlows = solutions.reduce((acc, { flowId, value }) => {
        return { ...acc, [flowId]: value };
    }, definedFlows);

    return { definedFlows: newDefinedFlows, changed: true };
};

/**
 * Solves the system iteratively until no more flows can be determined.
 * @param {Array<Object>} nodes - All nodes in the system
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Initial flow values from constraints
 * @param {number} maxIterations - Maximum iterations to prevent infinite loops
 * @returns {Object} Final defined flow values
 */
export const solveIteratively = (nodes, flows, definedFlows, maxIterations) => {
    let currentFlows = definedFlows;
    let iteration = 0;

    while (iteration < maxIterations) {
        const { definedFlows: newFlows, changed } = solveIteration(
            nodes,
            flows,
            currentFlows,
        );
        currentFlows = newFlows;

        if (!changed) break;
        iteration++;
    }

    return currentFlows;
};
