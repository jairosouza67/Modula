/**
 * One-time migration helper — copies data from old "vidraerp:*" localStorage keys
 * to new "modulaapp:*" keys, then removes the old ones.
 *
 * Safe to call on every app boot: does nothing if migration already completed.
 */
const KEY_MAP: Record<string, string> = {
  "vidraerp:auth:session": "modulaapp:auth:session",
  "vidraerp:auth:users": "modulaapp:auth:users",
  "vidraerp:settings:company": "modulaapp:settings:company",
  "vidraerp:crm:clientes": "modulaapp:crm:clientes",
  "vidraerp:crm:fornecedores": "modulaapp:crm:fornecedores",
};

const MIGRATION_FLAG = "modulaapp:migration:v1";

export function migrateLegacyStorage(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  // Already migrated — nothing to do
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  try {
    for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        // Only copy if new key doesn't already have data
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, oldValue);
        }
        localStorage.removeItem(oldKey);
      }
    }

    localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    // Silently fail — migration will retry on next boot if flag not set
  }
}
