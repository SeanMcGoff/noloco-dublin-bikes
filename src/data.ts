import { FieldTypeName } from "./field_types";
import type { SchemaField } from "./schema";

// Cleans the data into the field types
export function cleanData(data: any[], schema: SchemaField[]): any[] {
  // Ideally these helpers would be in field_types.ts 
  // but I'm crunched for time in this project
  const toNullIfEmpty = (v: any) => {
    if (v === undefined) return null;
    if (v === null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  };

  const parseBoolean = (v: any): boolean | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") {
      if (v === 1) return true;
      if (v === 0) return false;
      return null;
    }
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true") return true;
      if (s === "false") return false;
      if (s === "1") return true;
      if (s === "0") return false;
    }
    return null;
  };

  const parseNumber = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") {
      if (Number.isFinite(v)) return v;
      return null;
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (s === "") return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const parseDate = (v: any): Date | null => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
    if (typeof v === "number") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (s === "") return null;
      const ts = Date.parse(s);
      return Number.isNaN(ts) ? null : new Date(ts);
    }
    return null;
  };

  const convert = (raw: any, field: SchemaField): any => {
    const v = toNullIfEmpty(raw);
    switch (field.type) {
      case FieldTypeName.TEXT:
        return v === null ? null : String(v);
      case FieldTypeName.INTEGER: {
        const n = parseNumber(v);
        if (n === null) return null;
        return Math.trunc(n);
      }
      case FieldTypeName.FLOAT: {
        const n = parseNumber(v);
        return n === null ? null : n;
      }
      case FieldTypeName.DATE:
        return parseDate(v);
      case FieldTypeName.BOOLEAN:
        return parseBoolean(v);
      case FieldTypeName.OPTION: {
        if (v === null) return null;
        const s = String(v).trim().toLowerCase();
        // schema.options were produced as lower-cased unique values in inference
        return field.options.includes(s) ? s : String(v).trim().toLowerCase();
      }
      default:
        return v === null ? null : String(v);
    }
  };

  return data.map((item) => {
    const out: Record<string, any> = {};
    for (const f of schema) {
      const raw =
        item && typeof item === "object" ? item[f.display] : undefined;
      out[f.name] = convert(raw, f);
    }
    return out;
  });
}

// Filters cleaned data based on a single condition
export function filterData(
  data: Record<string, unknown>[],
  fieldName: string,
  operator: "eq" | "gt" | "lt",
  value: number | string,
): any[] {
  return data.filter((item) => {
    const v = item[fieldName];

    switch (operator) {
      case "eq":
        return v === value;
      case "gt":
        if (typeof v !== "number" || typeof value !== "number") return false;
        return v > value;
      case "lt":
        if (typeof v !== "number" || typeof value !== "number") return false;
        return v < value;
      default:
        return false;
    }
  });
}
