import { validateInput } from "@/lib/auth/security";

export function sanitizeTextFields<T>(data: T, textFields: string[]): T {
  const record = data as Record<string, unknown>;
  for (const field of textFields) {
    const value = record[field];
    if (typeof value === "string") {
      const result = validateInput(value);
      if (!result.isValid) {
        throw new Error(`Campo inválido (${field}): ${result.reason}`);
      }
    }
  }
  return data;
}
