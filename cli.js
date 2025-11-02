import yaml from "js-yaml";
import fs from "fs";
import { solve } from "./src/solver.js";
import { formatResult } from "./src/formatter.js";
import { parseSimplifiedYaml, validateSimplifiedYaml } from "./src/parser.js";

try {
    const args = process.argv.slice(2);
    if (args.length === 0) throw new Error("Usage: node cli.js <yaml-file>");

    const filename = args[0];

    const yamlData = yaml.load(fs.readFileSync(filename, "utf8"));
    validateSimplifiedYaml(yamlData);
    const config = parseSimplifiedYaml(yamlData);

    const result = solve(config);
    console.log(formatResult(result));

    if (!result.success) process.exit(1);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
