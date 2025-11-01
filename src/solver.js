// ============================================================================
// Main Solver
// ============================================================================

import { evaluateAllConstraints } from './expressions.js';
import { solveIteratively } from './balance.js';
import {
    isFullySolved,
    getUndeterminedFlowIds,
    verifyBalance,
} from './verification.js';

/**
 * Solves a Sankey diagram flow system using constraints and balance equations.
 *
 * The solver works in three steps:
 * 1. Evaluates explicit constraints to get initial flow values
 * 2. Iteratively solves using node balance constraints (sum(inputs) = sum(outputs))
 * 3. Verifies the solution is complete and consistent
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.parameters - Parameter values used in constraints
 * @param {Array<Object>} config.nodes - Nodes in the system
 * @param {Array<Object>} config.flows - Flows in the system
 * @param {Array<string>} config.constraints - Explicit constraints
 * @returns {Object} Result object with success flag and either flows or error details
 *
 * @example
 * const result = solve({
 *   parameters: { total: 100 },
 *   nodes: [{ id: 'A' }, { id: 'B' }],
 *   flows: [{ id: 'flow1', from: 'A', to: 'B' }],
 *   constraints: ['flows.flow1 == parameters.total']
 * });
 *
 * if (result.success) {
 *   console.log(result.flows); // { flow1: 100 }
 * } else {
 *   console.error(result.error);
 * }
 */
export const solve = (config) => {
    const {
        parameters = {},
        nodes = [],
        flows = [],
        constraints = [],
    } = config;

    try {
        // Step 1: Evaluate explicit constraints
        const initialFlows = evaluateAllConstraints(constraints, parameters);

        // Step 2: Iteratively solve using balance constraints
        const maxIterations = flows.length * 2;
        const definedFlows = solveIteratively(
            nodes,
            flows,
            initialFlows,
            maxIterations,
        );

        // Step 3: Check if fully solved
        if (isFullySolved(flows, definedFlows)) {
            const balanceErrors = verifyBalance(nodes, flows, definedFlows);

            if (balanceErrors.length > 0) {
                return {
                    success: false,
                    error: "Contradictory constraints",
                    balanceErrors,
                    definedFlows,
                };
            }

            return {
                success: true,
                flows: definedFlows,
            };
        } else {
            const undeterminedFlows = getUndeterminedFlowIds(
                flows,
                definedFlows,
            );

            return {
                success: false,
                error: "Underdetermined system",
                definedFlows,
                undeterminedFlows,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};
