// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Formats a flows object as a list of "flowId: value" lines.
 * @param {Object} flows - Flow values to format
 * @returns {string} Formatted flow list
 */
export const formatFlowList = (flows) => {
    return Object.entries(flows)
        .map(([flowId, value]) => `  ${flowId}: ${value}`)
        .join("\n");
};

/**
 * Formats balance error details for display.
 * @param {Array<Object>} errors - Balance errors to format
 * @returns {string} Formatted error messages
 */
export const formatBalanceErrors = (errors) => {
    return errors
        .map(
            (error) =>
                `  Node '${error.node}':\n` +
                `    Inputs: ${error.sumInputs}\n` +
                `    Outputs: ${error.sumOutputs}\n` +
                `    Difference: ${error.difference}`,
        )
        .join("\n");
};

/**
 * Formats a successful solve result.
 * @param {Object} result - Result object with success=true
 * @returns {string} Formatted success message
 */
export const formatSuccess = (result) => {
    return (
        "✓ System is solvable\n\nFlow values:\n" + formatFlowList(result.flows)
    );
};

/**
 * Formats an underdetermined system result.
 * @param {Object} result - Result object with underdetermined error
 * @returns {string} Formatted error message
 */
export const formatUnderdetermined = (result) => {
    const parts = [`✗ ${result.error}\n`];

    if (Object.keys(result.definedFlows).length > 0) {
        parts.push(
            "Defined flows:\n" + formatFlowList(result.definedFlows) + "\n",
        );
    }

    if (result.undeterminedFlows) {
        parts.push("Undetermined flows:");
        parts.push(result.undeterminedFlows.map((id) => `  ${id}`).join("\n"));
        parts.push(
            `\nNeed ${result.undeterminedFlows.length} more constraint(s).`,
        );
    }

    return parts.join("\n");
};

/**
 * Formats a contradictory constraints result.
 * @param {Object} result - Result object with balance errors
 * @returns {string} Formatted error message
 */
export const formatContradictory = (result) => {
    const parts = [`✗ ${result.error}\n`];

    if (result.balanceErrors) {
        parts.push(
            "Balance violations:\n" + formatBalanceErrors(result.balanceErrors),
        );
    }

    return parts.join("\n");
};

/**
 * Formats a solve result based on its type (success/error).
 * @param {Object} result - Result object from solve()
 * @returns {string} Formatted result message
 */
export const formatResult = (result) => {
    if (result.success) {
        return formatSuccess(result);
    } else if (result.balanceErrors) {
        return formatContradictory(result);
    } else {
        return formatUnderdetermined(result);
    }
};
