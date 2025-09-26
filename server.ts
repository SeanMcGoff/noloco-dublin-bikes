import { cleanData, filterData } from "./src/data";
import { getSchemaFromJSON } from "./src/schema";
import type { SchemaField } from "./src/schema";

import express from "express";
import * as z from "zod";

const app = express();
const port = 3000;

const data = require("./data/dublin-bikes.json");

const operatorObj = z.union([
  z.object({ eq: z.union([z.string(),z.number()]) }),
  z.object({ gt: z.union([z.string(),z.number()]) }),
  z.object({ lt: z.union([z.string(),z.number()]) }),
]);

const querySchema = z.object({
  where: z
    .record(z.string(), operatorObj)
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "where must contain at least one field",
    }),
});

app.get("/schema", express.json(), (req, res) => {
  if (!Array.isArray(data)) {
    return res.status(500).json({ error: "Data is not an array" });
  }
  const schema: SchemaField[] = getSchemaFromJSON(data);

  res.json({
    schema,
  });
});

app.post("/data", express.json(), (req, res) => {
  try {
    const parsed = querySchema.parse(req.body);

    // Runtime guard
    const entries = Object.entries(parsed.where);

    const schema: SchemaField[] = getSchemaFromJSON(data);

    // Validate all requested fields exist and are numeric (if gt/lt)
    for (const [fieldName, opObj] of entries) {
      const operator = Object.keys(opObj)[0] as "eq" | "gt" | "lt";
      const value = (opObj as any)[operator] as number;

      if (
        !schema.find(
          (f) =>
            f.name === fieldName &&
            // Equality can be any type, but gt/lt must be numeric
            (operator === "eq" || f.type === "INTEGER" || f.type === "FLOAT"),
        )
      ) {
        return res.status(400).json({
          error: `Field ${fieldName} not found or cannot be used with operator ${operator}`,
        });
      }

      if (operator !== "eq" && typeof value !== "number") {
        return res.status(400).json({
          error: `Invalid value for field ${fieldName}`,
        });
      }
    }

    // Clean the data according to the inferred schema
    const cleaned = cleanData(data, schema);

    // Apply all filters in sequence
    // Ideally this would be done in a single pass for performance, but alas,
    // time is limited.
    let filtered = cleaned;
    for (const [fieldName, opObj] of entries) {
      const operator = Object.keys(opObj)[0] as "eq" | "gt" | "lt";
      const value = (opObj as any)[operator] as number;
      filtered = filterData(filtered, fieldName, operator, value);
    }

    return res.json(filtered);
  } catch (err) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
