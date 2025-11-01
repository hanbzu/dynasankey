import yaml from "js-yaml";
import fs from "fs";
import { solve } from "./src/solver.js";
import { formatResult } from "./src/formatter.js";
import { parseSimplifiedYaml, validateSimplifiedYaml } from "./src/parser.js";

// ============================================================================
// CLI Interface
// ============================================================================

/**
 * Reads and parses a YAML file.
 * @param {string} filename - Path to YAML file
 * @returns {Object} Parsed YAML content
 */
const readYamlFile = (filename) => {
    const fileContents = fs.readFileSync(filename, "utf8");
    return yaml.load(fileContents);
};

/**
 * Main CLI entry point.
 * Reads a YAML config file, solves the system, and outputs the result.
 */
const main = () => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: node sankey-solver.js <yaml-file>");
        process.exit(1);
    }

    const filename = args[0];

    try {
        const yamlData = readYamlFile(filename);

        // Validate and parse the simplified YAML format
        validateSimplifiedYaml(yamlData);
        const config = parseSimplifiedYaml(yamlData);

        // Solve the system
        const result = solve(config);
        console.log(formatResult(result));

        if (!result.success) {
            process.exit(1);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export solve function for programmatic use
export { solve };
