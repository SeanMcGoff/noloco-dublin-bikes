import { FieldTypeName, getFieldTypeFromValues } from "./field_types";
import { camelCase } from "lodash";

export type SchemaField = {
  display: string; // original field name
  name: string; // camelCased field name
  type: FieldTypeName; // inferred type as string
  options: string[]; // for OPTION type, the unique options
};

export function getSchemaFromJSON(data: any[]): SchemaField[] {
  const fieldValues: Record<string, any[]> = {};

  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    for (const [key, value] of Object.entries(item)) {
      if (!fieldValues[key]) fieldValues[key] = [];
      fieldValues[key].push(value);
    }
  }

  // TODO: deal with duplicate fields (e.g. "address" and "name")

  return Object.entries(fieldValues).map(([display, values]) => {
    const [typeName, options] = getFieldTypeFromValues(values);
    return {
      display,
      name: camelCase(display),
      type: typeName ?? FieldTypeName.TEXT,
      options: options ?? [],
    };
  });
}
