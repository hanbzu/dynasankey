// ============================================================================
// Balance Solving Tests - Example
// ============================================================================
// This example demonstrates testing the node balance solving logic.

import {
    getNodeFlows,
    isSourceOrSink,
    getUndefinedFlows,
    sumDefinedFlows,
    solveNodeBalance,
    solveIteration,
    solveIteratively,
} from './balance.js';

// Simple assertion helpers
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
};

const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(
            `${message}\nExpected: ${expected}\nActual: ${actual}`
        );
    }
};

const assertDeepEqual = (actual, expected, message) => {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(
            `${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`
        );
    }
};

// ============================================================================
// Test: getNodeFlows
// ============================================================================

console.log('Testing getNodeFlows...');

const testFlows = [
    { id: 'f1', from: 'A', to: 'B' },
    { id: 'f2', from: 'A', to: 'C' },
    { id: 'f3', from: 'B', to: 'D' },
    { id: 'f4', from: 'C', to: 'D' },
];

// Test 1: Node with multiple outputs
const nodeA = { id: 'A' };
const { inputs: aInputs, outputs: aOutputs } = getNodeFlows(nodeA, testFlows);
assertEqual(aInputs.length, 0, 'Node A has no inputs');
assertEqual(aOutputs.length, 2, 'Node A has two outputs');
assertEqual(aOutputs[0].id, 'f1', 'First output is f1');
assertEqual(aOutputs[1].id, 'f2', 'Second output is f2');

// Test 2: Node with one input and one output
const nodeB = { id: 'B' };
const { inputs: bInputs, outputs: bOutputs } = getNodeFlows(nodeB, testFlows);
assertEqual(bInputs.length, 1, 'Node B has one input');
assertEqual(bOutputs.length, 1, 'Node B has one output');
assertEqual(bInputs[0].id, 'f1', 'Input is f1');
assertEqual(bOutputs[0].id, 'f3', 'Output is f3');

// Test 3: Node with multiple inputs
const nodeD = { id: 'D' };
const { inputs: dInputs, outputs: dOutputs } = getNodeFlows(nodeD, testFlows);
assertEqual(dInputs.length, 2, 'Node D has two inputs');
assertEqual(dOutputs.length, 0, 'Node D has no outputs');

console.log('✓ getNodeFlows tests passed');

// ============================================================================
// Test: isSourceOrSink
// ============================================================================

console.log('Testing isSourceOrSink...');

// Test 1: Source node (no inputs)
assert(isSourceOrSink([], [{ id: 'f1' }]), 'Node with no inputs is source');

// Test 2: Sink node (no outputs)
assert(isSourceOrSink([{ id: 'f1' }], []), 'Node with no outputs is sink');

// Test 3: Intermediate node
assert(
    !isSourceOrSink([{ id: 'f1' }], [{ id: 'f2' }]),
    'Node with inputs and outputs is not source/sink'
);

// Test 4: Isolated node
assert(isSourceOrSink([], []), 'Isolated node is considered source/sink');

console.log('✓ isSourceOrSink tests passed');

// ============================================================================
// Test: getUndefinedFlows
// ============================================================================

console.log('Testing getUndefinedFlows...');

const flowList = [
    { id: 'f1' },
    { id: 'f2' },
    { id: 'f3' },
];

const definedFlows = {
    f1: 100,
    f3: 200,
};

// Test: Filter out defined flows
const undefinedFlows = getUndefinedFlows(flowList, definedFlows);
assertEqual(undefinedFlows.length, 1, 'One undefined flow');
assertEqual(undefinedFlows[0].id, 'f2', 'f2 is undefined');

console.log('✓ getUndefinedFlows tests passed');

// ============================================================================
// Test: sumDefinedFlows
// ============================================================================

console.log('Testing sumDefinedFlows...');

// Test 1: Sum defined flows
const sum1 = sumDefinedFlows(flowList, definedFlows);
assertEqual(sum1, 300, 'Sum of defined flows is 300 (100 + 200)');

// Test 2: Empty flows
const sum2 = sumDefinedFlows([], definedFlows);
assertEqual(sum2, 0, 'Sum of empty flow list is 0');

// Test 3: No defined flows
const sum3 = sumDefinedFlows(flowList, {});
assertEqual(sum3, 0, 'Sum when no flows defined is 0');

console.log('✓ sumDefinedFlows tests passed');

// ============================================================================
// Test: solveNodeBalance
// ============================================================================

console.log('Testing solveNodeBalance...');

const systemFlows = [
    { id: 'in1', from: 'A', to: 'B' },
    { id: 'in2', from: 'C', to: 'B' },
    { id: 'out1', from: 'B', to: 'D' },
    { id: 'out2', from: 'B', to: 'E' },
];

// Test 1: Solve for one output (3 flows known, 1 unknown)
const solution1 = solveNodeBalance(
    { id: 'B' },
    systemFlows,
    { in1: 100, in2: 50, out1: 80 } // out2 unknown
);
assert(solution1 !== null, 'Should return a solution');
assertEqual(solution1.flowId, 'out2', 'Solved for out2');
assertEqual(solution1.value, 70, 'out2 = (100 + 50) - 80 = 70');

// Test 2: Solve for one input (3 flows known, 1 unknown)
const solution2 = solveNodeBalance(
    { id: 'B' },
    systemFlows,
    { in1: 100, out1: 80, out2: 70 } // in2 unknown
);
assert(solution2 !== null, 'Should return a solution');
assertEqual(solution2.flowId, 'in2', 'Solved for in2');
assertEqual(solution2.value, 50, 'in2 = (80 + 70) - 100 = 50');

// Test 3: Cannot solve - too many unknowns
const solution3 = solveNodeBalance(
    { id: 'B' },
    systemFlows,
    { in1: 100, in2: 50 } // 2 unknowns
);
assertEqual(solution3, null, 'Cannot solve with 2 unknowns');

// Test 4: Cannot solve - all flows known
const solution4 = solveNodeBalance(
    { id: 'B' },
    systemFlows,
    { in1: 100, in2: 50, out1: 80, out2: 70 }
);
assertEqual(solution4, null, 'Cannot solve when all flows known');

// Test 5: Skip source node
const solution5 = solveNodeBalance(
    { id: 'A' },
    systemFlows,
    { out1: 100 }
);
assertEqual(solution5, null, 'Source nodes are skipped');

// Test 6: Skip sink node
const solution6 = solveNodeBalance(
    { id: 'D' },
    systemFlows,
    { in1: 100 }
);
assertEqual(solution6, null, 'Sink nodes are skipped');

console.log('✓ solveNodeBalance tests passed');

// ============================================================================
// Test: solveIteration
// ============================================================================

console.log('Testing solveIteration...');

const nodes = [
    { id: 'A' }, // source
    { id: 'B' },
    { id: 'C' },
    { id: 'D' }, // sink
];

const flows = [
    { id: 'ab', from: 'A', to: 'B' },
    { id: 'bc', from: 'B', to: 'C' },
    { id: 'cd', from: 'C', to: 'D' },
];

// Test 1: One solvable node
const result1 = solveIteration(nodes, flows, { ab: 100 });
assert(result1.changed, 'Iteration made changes');
assertEqual(result1.definedFlows.ab, 100, 'Original flow preserved');
assertEqual(result1.definedFlows.bc, 100, 'Node B solved: bc = ab');

// Test 2: No solvable nodes
const result2 = solveIteration(nodes, flows, { ab: 100, bc: 100, cd: 100 });
assert(!result2.changed, 'No changes when all flows known');

// Test 3: Multiple solvable nodes in one iteration
const complexFlows = [
    { id: 'ab', from: 'A', to: 'B' },
    { id: 'ac', from: 'A', to: 'C' },
    { id: 'bd', from: 'B', to: 'D' },
    { id: 'cd', from: 'C', to: 'D' },
];

const result3 = solveIteration(nodes, complexFlows, { ab: 60, ac: 40 });
assert(result3.changed, 'Iteration solved nodes');
assertEqual(result3.definedFlows.bd, 60, 'Node B solved');
assertEqual(result3.definedFlows.cd, 40, 'Node C solved');

console.log('✓ solveIteration tests passed');

// ============================================================================
// Test: solveIteratively
// ============================================================================

console.log('Testing solveIteratively...');

// Test 1: Chain that requires multiple iterations
const chainNodes = [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' },
    { id: 'D' },
];

const chainFlows = [
    { id: 'ab', from: 'A', to: 'B' },
    { id: 'bc', from: 'B', to: 'C' },
    { id: 'cd', from: 'C', to: 'D' },
];

const iterativeResult = solveIteratively(
    chainNodes,
    chainFlows,
    { ab: 100 },
    10
);

assertEqual(iterativeResult.ab, 100, 'Initial constraint preserved');
assertEqual(iterativeResult.bc, 100, 'Second flow solved');
assertEqual(iterativeResult.cd, 100, 'Third flow solved');

// Test 2: System that cannot be fully solved
const partialFlows = [
    { id: 'ab', from: 'A', to: 'B' },
    { id: 'ac', from: 'A', to: 'C' },
    { id: 'bd', from: 'B', to: 'D' },
    { id: 'cd', from: 'C', to: 'D' },
];

const partialResult = solveIteratively(
    chainNodes,
    partialFlows,
    { ab: 60 },
    10
);

assertEqual(partialResult.ab, 60, 'Constraint preserved');
assertEqual(partialResult.bd, 60, 'Node B solved');
assertEqual(partialResult.ac, undefined, 'ac remains undefined');
assertEqual(partialResult.cd, undefined, 'cd remains undefined');

console.log('✓ solveIteratively tests passed');

// ============================================================================
// Summary
// ============================================================================

console.log('\n========================================');
console.log('All balance tests passed! ✓');
console.log('========================================\n');
console.log('The balance module is independently testable');
console.log('and handles various graph topologies correctly.');
