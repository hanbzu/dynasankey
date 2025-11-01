// ============================================================================
// Expression Evaluation Tests - Example
// ============================================================================
// This is an example test file showing how the modular structure enables
// easy unit testing. You can use any test framework (Jest, Mocha, Node's
// built-in test runner, etc.)

import {
    evaluateExpression,
    parseConstraint,
    evaluateConstraint,
    evaluateAllConstraints,
} from './expressions.js';

// Simple assertion helper
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

// ============================================================================
// Test: evaluateExpression
// ============================================================================

console.log('Testing evaluateExpression...');

// Test 1: Simple parameter substitution
const result1 = evaluateExpression(
    'parameters.x + 10',
    { x: 5 },
    {}
);
assertEqual(result1, 15, 'Simple parameter addition');

// Test 2: Flow substitution
const result2 = evaluateExpression(
    'flows.a * 2',
    {},
    { a: 10 }
);
assertEqual(result2, 20, 'Simple flow multiplication');

// Test 3: Combined parameters and flows
const result3 = evaluateExpression(
    'parameters.base + flows.f1 * parameters.multiplier',
    { base: 100, multiplier: 3 },
    { f1: 50 }
);
assertEqual(result3, 250, 'Combined parameters and flows');

// Test 4: Missing parameter throws error
try {
    evaluateExpression('parameters.missing', {}, {});
    assert(false, 'Should have thrown error for missing parameter');
} catch (error) {
    assert(
        error.message.includes('Unknown parameter'),
        'Error message should mention unknown parameter'
    );
}

// Test 5: Missing flow throws error
try {
    evaluateExpression('flows.missing', {}, {});
    assert(false, 'Should have thrown error for missing flow');
} catch (error) {
    assert(
        error.message.includes('not yet defined'),
        'Error message should mention undefined flow'
    );
}

console.log('✓ evaluateExpression tests passed');

// ============================================================================
// Test: parseConstraint
// ============================================================================

console.log('Testing parseConstraint...');

// Test 1: Valid constraint
const [left1, right1] = parseConstraint('flows.x == 100');
assertEqual(left1, 'flows.x', 'Left side parsed correctly');
assertEqual(right1, '100', 'Right side parsed correctly');

// Test 2: Constraint with whitespace
const [left2, right2] = parseConstraint('  flows.y  ==  parameters.z + 5  ');
assertEqual(left2, 'flows.y', 'Left side trimmed correctly');
assertEqual(right2, 'parameters.z + 5', 'Right side trimmed correctly');

// Test 3: Invalid constraint (no ==)
try {
    parseConstraint('flows.x = 100');
    assert(false, 'Should have thrown error for invalid constraint');
} catch (error) {
    assert(
        error.message.includes('exactly one =='),
        'Error message should mention == requirement'
    );
}

// Test 4: Invalid constraint (multiple ==)
try {
    parseConstraint('flows.x == 100 == 200');
    assert(false, 'Should have thrown error for multiple ==');
} catch (error) {
    assert(
        error.message.includes('exactly one =='),
        'Error message should mention == requirement'
    );
}

console.log('✓ parseConstraint tests passed');

// ============================================================================
// Test: evaluateConstraint
// ============================================================================

console.log('Testing evaluateConstraint...');

// Test 1: Simple constraint
const flows1 = evaluateConstraint(
    'flows.a == 42',
    {},
    {}
);
assertEqual(flows1.a, 42, 'Flow value set correctly');

// Test 2: Constraint with parameter
const flows2 = evaluateConstraint(
    'flows.b == parameters.value * 2',
    { value: 25 },
    {}
);
assertEqual(flows2.b, 50, 'Constraint with parameter evaluated correctly');

// Test 3: Constraint with existing flow
const flows3 = evaluateConstraint(
    'flows.c == flows.a + 10',
    {},
    { a: 100 }
);
assertEqual(flows3.a, 100, 'Previous flow preserved');
assertEqual(flows3.c, 110, 'New flow calculated from existing flow');

// Test 4: Invalid left side (not a flow reference)
try {
    evaluateConstraint('parameters.x == 100', {}, {});
    assert(false, 'Should have thrown error for non-flow left side');
} catch (error) {
    assert(
        error.message.includes('must be a flow reference'),
        'Error message should mention flow reference requirement'
    );
}

console.log('✓ evaluateConstraint tests passed');

// ============================================================================
// Test: evaluateAllConstraints
// ============================================================================

console.log('Testing evaluateAllConstraints...');

// Test 1: Multiple independent constraints
const flows4 = evaluateAllConstraints(
    [
        'flows.x == 10',
        'flows.y == 20',
        'flows.z == 30',
    ],
    {}
);
assertEqual(flows4.x, 10, 'First constraint evaluated');
assertEqual(flows4.y, 20, 'Second constraint evaluated');
assertEqual(flows4.z, 30, 'Third constraint evaluated');

// Test 2: Dependent constraints (order matters)
const flows5 = evaluateAllConstraints(
    [
        'flows.a == parameters.base',
        'flows.b == flows.a * 2',
        'flows.c == flows.a + flows.b',
    ],
    { base: 100 }
);
assertEqual(flows5.a, 100, 'Base flow set from parameter');
assertEqual(flows5.b, 200, 'Second flow calculated from first');
assertEqual(flows5.c, 300, 'Third flow calculated from first two');

// Test 3: Empty constraints
const flows6 = evaluateAllConstraints([], {});
assertEqual(Object.keys(flows6).length, 0, 'Empty constraints return empty object');

// Test 4: Error in one constraint
try {
    evaluateAllConstraints(
        [
            'flows.x == 10',
            'flows.y == flows.undefined',
            'flows.z == 30',
        ],
        {}
    );
    assert(false, 'Should have thrown error for undefined flow reference');
} catch (error) {
    assert(
        error.message.includes('flows.y == flows.undefined'),
        'Error message should include the failing constraint'
    );
}

console.log('✓ evaluateAllConstraints tests passed');

// ============================================================================
// Summary
// ============================================================================

console.log('\n========================================');
console.log('All expression tests passed! ✓');
console.log('========================================\n');
console.log('This demonstrates how the modular structure');
console.log('allows for easy unit testing of individual');
console.log('components without needing the full system.');
