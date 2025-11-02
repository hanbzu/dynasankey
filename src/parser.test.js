import { describe, it, expect } from "vitest";
import { parseSimplifiedYaml, validateSimplifiedYaml } from "./parser.js";

describe("validateSimplifiedYaml", () => {
    it("should accept valid minimal YAML", () => {
        const yaml = {
            values: { x: 10 },
            nodes: [{ id: "A" }],
            flows: [{ id: "f1", from: "A", to: "B" }],
        };

        expect(() => validateSimplifiedYaml(yaml)).not.toThrow();
    });

    it("should reject non-object input", () => {
        expect(() => validateSimplifiedYaml(null)).toThrow(
            "YAML must be an object",
        );
        expect(() => validateSimplifiedYaml("string")).toThrow(
            "YAML must be an object",
        );
        expect(() => validateSimplifiedYaml([])).toThrow(
            "YAML must be an object",
        );
    });

    it("should reject missing nodes array", () => {
        const yaml = {
            values: {},
            flows: [],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'YAML must contain a "nodes" array',
        );
    });

    it("should reject missing flows array", () => {
        const yaml = {
            values: {},
            nodes: [],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'YAML must contain a "flows" array',
        );
    });

    it("should reject missing values object", () => {
        const yaml = {
            nodes: [],
            flows: [],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'YAML must contain a "values" object',
        );
    });

    it("should reject node without id", () => {
        const yaml = {
            values: {},
            nodes: [{ label: "Node A" }],
            flows: [],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'Each node must have an "id" field',
        );
    });

    it("should reject flow without id", () => {
        const yaml = {
            values: {},
            nodes: [{ id: "A" }],
            flows: [{ from: "A", to: "B" }],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'Each flow must have an "id" field',
        );
    });

    it("should reject flow without from field", () => {
        const yaml = {
            values: {},
            nodes: [{ id: "A" }],
            flows: [{ id: "f1", to: "B" }],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'Flow "f1" must have a "from" field',
        );
    });

    it("should reject flow without to field", () => {
        const yaml = {
            values: {},
            nodes: [{ id: "A" }],
            flows: [{ id: "f1", from: "A" }],
        };

        expect(() => validateSimplifiedYaml(yaml)).toThrow(
            'Flow "f1" must have a "to" field',
        );
    });
});

describe("parseSimplifiedYaml", () => {
    describe("basic parsing", () => {
        it("should separate numeric parameters from flows", () => {
            const yaml = {
                values: {
                    total: 100,
                    rate: 0.5,
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({ total: 100, rate: 0.5 });
            expect(result.constraints).toEqual([]);
        });

        it("should convert numeric flow value to constraint", () => {
            const yaml = {
                values: {
                    f1: 100,
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({});
            expect(result.constraints).toEqual(["flows.f1 == 100"]);
        });

        it("should convert string flow formula to constraint", () => {
            const yaml = {
                values: {
                    total: 100,
                    f1: "total * 2",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({ total: 100 });
            expect(result.constraints).toEqual([
                "flows.f1 == parameters.total * 2",
            ]);
        });

        it("should preserve nodes and flows unchanged", () => {
            const yaml = {
                values: {},
                nodes: [
                    { id: "A", label: "Node A" },
                    { id: "B", label: "Node B" },
                ],
                flows: [{ id: "f1", from: "A", to: "B", label: "Flow 1" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.nodes).toEqual(yaml.nodes);
            expect(result.flows).toEqual(yaml.flows);
        });
    });

    describe("formula parsing with prefixes", () => {
        it("should add parameters prefix to parameter references", () => {
            const yaml = {
                values: {
                    x: 10,
                    y: 20,
                    f1: "x + y",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toEqual([
                "flows.f1 == parameters.x + parameters.y",
            ]);
        });

        it("should add flows prefix to flow references", () => {
            const yaml = {
                values: {
                    f1: 100,
                    f2: "f1 * 2",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "B", to: "C" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toContainEqual(
                "flows.f2 == flows.f1 * 2",
            );
        });

        it("should handle mixed parameter and flow references", () => {
            const yaml = {
                values: {
                    rate: 0.5,
                    f1: 100,
                    f2: "f1 * rate",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "B", to: "C" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toContainEqual(
                "flows.f2 == flows.f1 * parameters.rate",
            );
        });

        it("should handle complex arithmetic expressions", () => {
            const yaml = {
                values: {
                    a: 10,
                    b: 20,
                    c: 5,
                    f1: "(a + b) / c",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toEqual([
                "flows.f1 == (parameters.a + parameters.b) / parameters.c",
            ]);
        });

        it("should not double-prefix already prefixed identifiers", () => {
            const yaml = {
                values: {
                    x: 10,
                    f1: "parameters.x * 2",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toEqual([
                "flows.f1 == parameters.x * 2",
            ]);
        });

        it("should handle formulas with multiple operations", () => {
            const yaml = {
                values: {
                    input: 1000,
                    loss_rate: 0.15,
                    boost: 50,
                    f1: "input * (1 - loss_rate) + boost",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toEqual([
                "flows.f1 == parameters.input * (1 - parameters.loss_rate) + parameters.boost",
            ]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty values object", () => {
            const yaml = {
                values: {},
                nodes: [{ id: "A" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({});
            expect(result.constraints).toEqual([]);
        });

        it("should handle values with underscores and numbers in names", () => {
            const yaml = {
                values: {
                    cost_per_km: 28,
                    distance_2023: 1380,
                    f1: "cost_per_km * distance_2023",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({
                cost_per_km: 28,
                distance_2023: 1380,
            });
            expect(result.constraints).toEqual([
                "flows.f1 == parameters.cost_per_km * parameters.distance_2023",
            ]);
        });

        it("should reject invalid value types", () => {
            const yaml = {
                values: {
                    invalid: { nested: "object" },
                },
                nodes: [{ id: "A" }],
                flows: [],
            };

            expect(() => parseSimplifiedYaml(yaml)).toThrow(
                "Invalid value type for 'invalid': object",
            );
        });

        it("should handle formulas with decimal numbers", () => {
            const yaml = {
                values: {
                    rate: 0.15,
                    f1: "rate * 100.5",
                },
                nodes: [{ id: "A" }, { id: "B" }],
                flows: [{ id: "f1", from: "A", to: "B" }],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.constraints).toEqual([
                "flows.f1 == parameters.rate * 100.5",
            ]);
        });
    });

    describe("integration examples", () => {
        it("should parse power distribution example", () => {
            const yaml = {
                values: {
                    total_energy: 1000,
                    residential_demand: 400,
                    loss_rate: 0.15,
                    src_trans: "total_energy",
                    trans_res: "residential_demand",
                    trans_loss: "src_trans * loss_rate",
                },
                nodes: [
                    { id: "source" },
                    { id: "transmission" },
                    { id: "residential" },
                    { id: "industrial" },
                    { id: "losses" },
                ],
                flows: [
                    { id: "src_trans", from: "source", to: "transmission" },
                    {
                        id: "trans_res",
                        from: "transmission",
                        to: "residential",
                    },
                    { id: "trans_ind", from: "transmission", to: "industrial" },
                    { id: "trans_loss", from: "transmission", to: "losses" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toEqual({
                total_energy: 1000,
                residential_demand: 400,
                loss_rate: 0.15,
            });

            expect(result.constraints).toContainEqual(
                "flows.src_trans == parameters.total_energy",
            );
            expect(result.constraints).toContainEqual(
                "flows.trans_res == parameters.residential_demand",
            );
            expect(result.constraints).toContainEqual(
                "flows.trans_loss == flows.src_trans * parameters.loss_rate",
            );
        });

        it("should parse train example with complex formulas", () => {
            const yaml = {
                values: {
                    distance: 1380,
                    coaches: 10,
                    cost_per_km: 28,
                    cost_per_coach: 1000,
                    seats: 350,
                    occupancy: 0.7,
                    avg_ticket_price: 137.38,
                    tickets: "avg_ticket_price * seats * occupancy",
                    per_km_costs: "distance * cost_per_km",
                    fixed_costs: "cost_per_coach * coaches",
                },
                nodes: [
                    { id: "tickets" },
                    { id: "subsidy" },
                    { id: "revenue" },
                ],
                flows: [
                    { id: "tickets", from: "tickets", to: "revenue" },
                    { id: "per_km_costs", from: "revenue", to: "per_km_costs" },
                    { id: "fixed_costs", from: "revenue", to: "fixed_costs" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            expect(result.parameters).toMatchObject({
                distance: 1380,
                coaches: 10,
                cost_per_km: 28,
                cost_per_coach: 1000,
                seats: 350,
                occupancy: 0.7,
                avg_ticket_price: 137.38,
            });

            expect(result.constraints).toContainEqual(
                "flows.tickets == parameters.avg_ticket_price * parameters.seats * parameters.occupancy",
            );
            expect(result.constraints).toContainEqual(
                "flows.per_km_costs == parameters.distance * parameters.cost_per_km",
            );
            expect(result.constraints).toContainEqual(
                "flows.fixed_costs == parameters.cost_per_coach * parameters.coaches",
            );
        });
    });

    describe("constraint ordering (topological sort)", () => {
        it("should sort constraints with dependencies", () => {
            const yaml = {
                values: {
                    a: 10,
                    f1: "a",
                    f2: "f1 * 2",
                    f3: "f2 + f1",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "B", to: "C" },
                    { id: "f3", from: "C", to: "D" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            // f1 should come before f2, and f2 should come before f3
            const f1Index = result.constraints.findIndex((c) =>
                c.includes("flows.f1 =="),
            );
            const f2Index = result.constraints.findIndex((c) =>
                c.includes("flows.f2 =="),
            );
            const f3Index = result.constraints.findIndex((c) =>
                c.includes("flows.f3 =="),
            );

            expect(f1Index).toBeLessThan(f2Index);
            expect(f2Index).toBeLessThan(f3Index);
        });

        it("should handle constraints with multiple dependencies", () => {
            const yaml = {
                values: {
                    base: 100,
                    f1: "base",
                    f2: "base * 2",
                    f3: "f1 + f2",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "A", to: "C" },
                    { id: "f3", from: "B", to: "D" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            // f3 depends on both f1 and f2, so both should come before it
            const f1Index = result.constraints.findIndex((c) =>
                c.includes("flows.f1 =="),
            );
            const f2Index = result.constraints.findIndex((c) =>
                c.includes("flows.f2 =="),
            );
            const f3Index = result.constraints.findIndex((c) =>
                c.includes("flows.f3 =="),
            );

            expect(f1Index).toBeLessThan(f3Index);
            expect(f2Index).toBeLessThan(f3Index);
        });

        it("should handle constraints with no dependencies first", () => {
            const yaml = {
                values: {
                    x: 100,
                    f3: "f1 + f2",
                    f1: "x",
                    f2: "x * 2",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "A", to: "C" },
                    { id: "f3", from: "B", to: "D" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            // f1 and f2 have no flow dependencies, so they should come before f3
            const f1Index = result.constraints.findIndex((c) =>
                c.includes("flows.f1 =="),
            );
            const f2Index = result.constraints.findIndex((c) =>
                c.includes("flows.f2 =="),
            );
            const f3Index = result.constraints.findIndex((c) =>
                c.includes("flows.f3 =="),
            );

            expect(f1Index).toBeLessThan(f3Index);
            expect(f2Index).toBeLessThan(f3Index);
        });

        it("should handle complex dependency chain", () => {
            const yaml = {
                values: {
                    distance: 1380,
                    cost_per_km: 28,
                    cost_per_coach: 1000,
                    coaches: 10,
                    per_km_costs: "distance * cost_per_km",
                    fixed_costs: "cost_per_coach * coaches",
                    rdc_profit: "(per_km_costs + fixed_costs) * 0.1",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
                flows: [
                    { id: "per_km_costs", from: "A", to: "B" },
                    { id: "fixed_costs", from: "A", to: "C" },
                    { id: "rdc_profit", from: "B", to: "D" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            // rdc_profit depends on both per_km_costs and fixed_costs
            const perKmIndex = result.constraints.findIndex((c) =>
                c.includes("flows.per_km_costs =="),
            );
            const fixedIndex = result.constraints.findIndex((c) =>
                c.includes("flows.fixed_costs =="),
            );
            const rdcIndex = result.constraints.findIndex((c) =>
                c.includes("flows.rdc_profit =="),
            );

            expect(perKmIndex).toBeLessThan(rdcIndex);
            expect(fixedIndex).toBeLessThan(rdcIndex);
        });

        it("should handle constraints with only parameter dependencies", () => {
            const yaml = {
                values: {
                    x: 10,
                    y: 20,
                    f1: "x + y",
                    f2: "x * y",
                },
                nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
                flows: [
                    { id: "f1", from: "A", to: "B" },
                    { id: "f2", from: "B", to: "C" },
                ],
            };

            const result = parseSimplifiedYaml(yaml);

            // Both f1 and f2 only depend on parameters, order doesn't matter
            // but they should both be present
            expect(result.constraints).toHaveLength(2);
            expect(
                result.constraints.some((c) => c.includes("flows.f1 ==")),
            ).toBe(true);
            expect(
                result.constraints.some((c) => c.includes("flows.f2 ==")),
            ).toBe(true);
        });
    });
});
