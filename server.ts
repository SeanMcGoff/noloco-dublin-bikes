import { cleanData, filterData } from "./src/data";
import { getSchemaFromJSON } from "./src/schema";
import type { SchemaField } from "./src/schema";

import express from "express";
import * as z from "zod";

const app = express();
const port = 3000;

const data = require("./data/dublin-bikes.json");

const operatorObj = z.union([
  z.object({ eq: z.number() }),
  z.object({ gt: z.number() }),
  z.object({ lt: z.number() }),
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

    const first = entries[0]!;
    const [fieldName, opObj] = first;
    const operator = Object.keys(opObj)[0] as "eq" | "gt" | "lt";
    const value = (opObj as any)[operator] as number;

    const schema: SchemaField[] = getSchemaFromJSON(data);
    if (
      !schema.find(
        (f) =>
          f.name === fieldName && (f.type === "INTEGER" || f.type === "FLOAT"),
      )
    ) {
      return res.status(400).json({
        error: `Field ${fieldName} of type INTEGER or FLOAT does not exist`,
      });
    }

    const cleaned = cleanData(data);
    const filtered = filterData(cleaned, fieldName, operator, value);

    return res.json(filtered);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
