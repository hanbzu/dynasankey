import { useState } from "react";
import yaml from "js-yaml";
import { solve } from "../solver.js";
import { formatResult } from "../formatter.js";
import { parseSimplifiedYaml, validateSimplifiedYaml } from "../parser.js";

function App() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setResult(null);

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const yamlContent = e.target.result;
                const yamlData = yaml.load(yamlContent);

                // Validate and parse the simplified YAML format
                validateSimplifiedYaml(yamlData);
                const config = parseSimplifiedYaml(yamlData);

                const solveResult = solve(config);
                setResult(solveResult);
            } catch (err) {
                setError(`Error processing YAML: ${err.message}`);
            }
        };

        reader.onerror = () => {
            setError("Error reading file");
        };

        reader.readAsText(file);
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
        setFileName(null);
    };

    return (
        <div
            style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: "2rem",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <header style={{ marginBottom: "2rem" }}>
                <h1 style={{ margin: 0, fontSize: "2rem", color: "#333" }}>
                    Nightmodel
                </h1>
                <p style={{ color: "#666", marginTop: "0.5rem" }}>
                    Sankey diagram solver and flow analyzer
                </p>
            </header>

            <main>
                {!result && !error && (
                    <div
                        style={{
                            border: "2px dashed #ccc",
                            borderRadius: "8px",
                            padding: "3rem",
                            textAlign: "center",
                            backgroundColor: "#f9f9f9",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = "#4a5568";
                            e.currentTarget.style.backgroundColor = "#f0f0f0";
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = "#ccc";
                            e.currentTarget.style.backgroundColor = "#f9f9f9";
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = "#ccc";
                            e.currentTarget.style.backgroundColor = "#f9f9f9";
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                                const input =
                                    document.getElementById("file-input");
                                input.files = files;
                                handleFileUpload({ target: input });
                            }
                        }}
                    >
                        <h2
                            style={{
                                color: "#666",
                                fontSize: "1.2rem",
                                marginBottom: "1rem",
                            }}
                        >
                            Upload YAML File
                        </h2>
                        <p style={{ color: "#999", marginBottom: "1.5rem" }}>
                            Click to browse or drag and drop your YAML
                            configuration file
                        </p>
                        <label
                            htmlFor="file-input"
                            style={{
                                display: "inline-block",
                                padding: "0.75rem 1.5rem",
                                backgroundColor: "#4a5568",
                                color: "white",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "#2d3748")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "#4a5568")
                            }
                        >
                            Choose File
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            accept=".yaml,.yml"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            backgroundColor: "#fee",
                            border: "1px solid #fcc",
                            borderRadius: "8px",
                            padding: "1.5rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 0.5rem 0",
                                color: "#c00",
                                fontSize: "1.1rem",
                            }}
                        >
                            Error
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#800",
                                fontFamily: "monospace",
                            }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={handleReset}
                            style={{
                                marginTop: "1rem",
                                padding: "0.5rem 1rem",
                                backgroundColor: "#c00",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#a00")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "#c00")
                            }
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {result && (
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "1.1rem",
                                        color: "#333",
                                    }}
                                >
                                    Results
                                </h3>
                                {fileName && (
                                    <p
                                        style={{
                                            margin: "0.25rem 0 0 0",
                                            fontSize: "0.9rem",
                                            color: "#666",
                                        }}
                                    >
                                        File: {fileName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleReset}
                                style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: "#4a5568",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "#2d3748")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "#4a5568")
                                }
                            >
                                Upload Another File
                            </button>
                        </div>

                        <div
                            style={{
                                backgroundColor: result.success
                                    ? "#efe"
                                    : "#fee",
                                border: `1px solid ${result.success ? "#cfc" : "#fcc"}`,
                                borderRadius: "8px",
                                padding: "1.5rem",
                            }}
                        >
                            <pre
                                style={{
                                    margin: 0,
                                    fontFamily: "Monaco, Consolas, monospace",
                                    fontSize: "0.9rem",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    color: "#333",
                                    lineHeight: "1.5",
                                }}
                            >
                                {formatResult(result)}
                            </pre>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        marginTop: "2rem",
                        fontSize: "0.9rem",
                        color: "#666",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "8px",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "1rem",
                            marginTop: 0,
                            marginBottom: "0.75rem",
                        }}
                    >
                        CLI Usage
                    </h3>
                    <p style={{ margin: "0 0 0.5rem 0" }}>
                        You can also use the command-line interface:
                    </p>
                    <pre
                        style={{
                            backgroundColor: "#2d3748",
                            color: "#e0e0e0",
                            padding: "1rem",
                            borderRadius: "4px",
                            overflow: "auto",
                            margin: 0,
                        }}
                    >
                        <code>node sankey-solver.js example.yaml</code>
                    </pre>
                </div>
            </main>
        </div>
    );
}

export default App;
