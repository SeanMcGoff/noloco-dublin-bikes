// Define field types
export type TEXT = string | null;
export type INTEGER = number & { __brand: "integer" };
export type FLOAT = number & { __brand: "float" };
export type DATE = Date | null;
export type BOOLEAN = boolean;
export type OPTION = string;

export type FieldType = TEXT | INTEGER | FLOAT | DATE | BOOLEAN | OPTION;

export type JSONValue = string | number | boolean | null;

export enum FieldTypeName {
  TEXT = "TEXT",
  INTEGER = "INTEGER",
  FLOAT = "FLOAT",
  DATE = "DATE",
  BOOLEAN = "BOOLEAN",
  OPTION = "OPTION",
}

// Helpers
function isBooleanValue(value: unknown): value is boolean | string {
  if (value === true || value === false) return true;
  if (typeof value !== "string") return false;
  const s = value.trim().toLowerCase();
  return s === "true" || s === "false";
}

function isNumericLike(value: JSONValue): boolean {
  if (typeof value === "number") return true;

  if (typeof value === "string") {
    const s = value.trim();
    if (s === "") return false;
    const n = Number(s);
    return !Number.isNaN(n) && Number.isFinite(n);
  }

  return false;
}

function isDateString(value: JSONValue): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (s === "") return false;
  const parsed = Date.parse(s);
  return !Number.isNaN(parsed);
}

// Field type, unique options (if any)
export type InferenceResult = [FieldTypeName | null, string[] | null];

// Main inference function
export function getFieldTypeFromValues(values: JSONValue[]): InferenceResult {
  if (values.length === 0) return [null, null];

  const hasNull = values.includes(null);
  const nonNull = values.filter(
    (v): v is Exclude<JSONValue, null> => v !== null,
  );

  if (hasNull && nonNull.length === 0) {
    return [null, null];
  }

  // Check if all non-null values are boolean-like
  if (!hasNull && nonNull.every(isBooleanValue)) {
    return [FieldTypeName.BOOLEAN, null];
  }

  // Check if all non-null values are date-like
  if (
    nonNull.length > 0 &&
    nonNull.every((v) => typeof v === "string" && isDateString(v))
  ) {
    return [FieldTypeName.DATE, null];
  }

  // Check if all non-null values are numeric-like
  const numericCandidates = nonNull.every(isNumericLike);
  if (numericCandidates) {
    const nums = nonNull.map((v) =>
      typeof v === "number" ? v : Number((v as string).trim()),
    );
    const anyFloat = nums.some((n) => !Number.isInteger(n));
    if (anyFloat) {
      return [FieldTypeName.FLOAT, null];
    } else {
      return [FieldTypeName.INTEGER, null];
    }
  }

  const normalize = (v: JSONValue) =>
    v === null ? null : String(v).trim().toLowerCase();

  const mappedNonNull = nonNull.map((v) => String(v).trim().toLowerCase());
  const unique = Array.from(new Set(mappedNonNull));
  // Arbitrary limit of 10 unique options to consider as OPTION type
  if (unique.length >= 2 && unique.length <= 10) {
    return [FieldTypeName.OPTION, unique];
  }

  return [FieldTypeName.TEXT, null];
}
