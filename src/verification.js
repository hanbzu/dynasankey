// ============================================================================
// Verification
// ============================================================================

import { getNodeFlows, isSourceOrSink, sumDefinedFlows } from './balance.js';

/**
 * Verifies that a single node's balance constraint is satisfied.
 * Balance constraint: sum(inputs) = sum(outputs)
 *
 * @param {Object} node - The node to verify
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Flow values to verify
 * @returns {Object|null} Error object if balance violated, null if valid
 */
export const verifyNodeBalance = (node, flows, definedFlows) => {
    const { inputs, outputs } = getNodeFlows(node, flows);

    // Skip source and sink nodes
    if (isSourceOrSink(inputs, outputs)) {
        return null;
    }

    // Check if all flows are defined
    const allDefined = [...inputs, ...outputs].every(
        (f) => definedFlows[f.id] !== undefined,
    );

    if (!allDefined) {
        return null;
    }

    const sumInputs = sumDefinedFlows(inputs, definedFlows);
    const sumOutputs = sumDefinedFlows(outputs, definedFlows);
    const difference = Math.abs(sumInputs - sumOutputs);

    // Allow small floating point errors
    if (difference > 0.0001) {
        return {
            node: node.id,
            sumInputs,
            sumOutputs,
            difference: sumInputs - sumOutputs,
        };
    }

    return null;
};

/**
 * Verifies balance constraints for all nodes in the system.
 * @param {Array<Object>} nodes - All nodes in the system
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Flow values to verify
 * @returns {Array<Object>} List of balance errors (empty if all valid)
 */
export const verifyBalance = (nodes, flows, definedFlows) => {
    return nodes
        .map((node) => verifyNodeBalance(node, flows, definedFlows))
        .filter((error) => error !== null);
};

/**
 * Checks if all flows in the system have been solved.
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Currently defined flow values
 * @returns {boolean} True if all flows have values
 */
export const isFullySolved = (flows, definedFlows) => {
    return flows.every((f) => definedFlows[f.id] !== undefined);
};

/**
 * Gets the IDs of flows that have not been determined yet.
 * @param {Array<Object>} flows - All flows in the system
 * @param {Object} definedFlows - Currently defined flow values
 * @returns {Array<string>} List of undetermined flow IDs
 */
export const getUndeterminedFlowIds = (flows, definedFlows) => {
    return flows
        .filter((f) => definedFlows[f.id] === undefined)
        .map((f) => f.id);
};
