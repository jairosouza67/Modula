import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

interface Migration {
  file: string;
  content: string;
}

function readMigrations(): Migration[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      content: fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"),
    }));
}

function normalize(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function extractPublicTables(allContent: string): string[] {
  const tables = new Set<string>();
  const regex = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)/gi;
  let match;
  while ((match = regex.exec(allContent)) !== null) {
    tables.add(match[1].toLowerCase());
  }
  return Array.from(tables).sort();
}

function extractTablesWithRls(allContent: string): string[] {
  const tables = new Set<string>();
  const regex =
    /alter\s+table\s+(?:if\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security/gi;
  let match;
  while ((match = regex.exec(allContent)) !== null) {
    tables.add(match[1].toLowerCase());
  }
  return Array.from(tables).sort();
}

function getLastMatch(normalized: string, regex: RegExp): RegExpMatchArray | null {
  const matches = [...normalized.matchAll(regex)];
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

function extractFinalFunction(allContent: string, name: string): string | null {
  const normalized = normalize(allContent);
  const regex = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${name}\\s*\\([^)]*\\)\\s*returns[\\s\\S]*?[$][$];`,
    "g",
  );
  const match = getLastMatch(normalized, regex);
  return match ? match[0] : null;
}

function extractFinalPolicy(allContent: string, table: string, name: string): string | null {
  const normalized = normalize(allContent);
  const regex = new RegExp(
    `create\\s+policy\\s+${name}\\s+on\\s+${table}\\s+for\\s+(?:select|insert|update|delete|all)[\\s\\S]*?;`,
    "g",
  );
  const match = getLastMatch(normalized, regex);
  return match ? match[0] : null;
}

function extractSecurityDefinerFunctions(
  allContent: string,
): { name: string; hasSearchPath: boolean }[] {
  const normalized = normalize(allContent);
  const regex =
    /create\s+or\s+replace\s+function\s+public\.([a-z_][a-z0-9_]*)[\s\S]*?security\s+definer[\s\S]*?[$][$];/g;
  const matches = [...normalized.matchAll(regex)];

  const latest = new Map<string, { declaration: string; name: string }>();
  for (const match of matches) {
    const declaration = match[0];
    const name = match[1];
    latest.set(name, { declaration, name });
  }

  return Array.from(latest.values()).map(({ declaration, name }) => ({
    name,
    hasSearchPath: declaration.includes("set search_path = public"),
  }));
}

describe("RLS Audit — Static Analysis of Migrations", () => {
  const migrations = readMigrations();
  const allContent = migrations.map((m) => m.content).join("\n");

  describe("Schema coverage", () => {
    it("every public table has RLS enabled", () => {
      const tables = extractPublicTables(allContent);
      const withRls = extractTablesWithRls(allContent);

      const missing = tables.filter((t) => !withRls.includes(t));

      expect(tables.length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    });

    it("final can_access_empresa does not contain authenticated bypass", () => {
      const canAccess = extractFinalFunction(allContent, "can_access_empresa");
      expect(canAccess).toBeTruthy();

      const bypassPattern =
        /auth\.role\(\)\s*=\s*'authenticated'\s+and\s+[^$]*00000000-0000-0000-0000-000000000001/;
      expect(canAccess!).not.toMatch(bypassPattern);
    });
  });

  describe("Storage policies", () => {
    it("storage.objects nfe_xml policies do not allow cross-tenant access", () => {
      const normalized = normalize(allContent);
      const regex = /create\s+policy\s+([a-z_][a-z0-9_]*)\s+on\s+storage\.objects[\s\S]*?;/g;
      const matches = [...normalized.matchAll(regex)];

      if (matches.length === 0) {
        return;
      }

      for (const match of matches) {
        const policy = match[0];
        const hasTenantIsolation =
          policy.includes("empresa_id") ||
          policy.includes("perfis_usuario") ||
          policy.includes("storage.foldername");

        const allowsAnyAuthenticated =
          policy.includes("auth.role() = 'authenticated'") && !hasTenantIsolation;

        expect(
          allowsAnyAuthenticated,
          `Storage policy allows any authenticated user without tenant isolation`,
        ).toBe(false);
      }
    });
  });

  describe("SECURITY DEFINER functions", () => {
    it("every SECURITY DEFINER function sets search_path = public", () => {
      const functions = extractSecurityDefinerFunctions(allContent);
      const missing = functions.filter((f) => !f.hasSearchPath).map((f) => f.name);

      expect(missing).toEqual([]);
    });
  });

  describe("Invite flow policies", () => {
    it("convites SELECT policy requires authentication", () => {
      const policy = extractFinalPolicy(
        allContent,
        "public\\.convites",
        "convites_select_by_token",
      );
      expect(policy).toBeTruthy();
      expect(policy!).toMatch(/auth\.uid\(\)|auth\.role\(\)/);
    });

    it("convites UPDATE policy requires authentication", () => {
      const policy = extractFinalPolicy(
        allContent,
        "public\\.convites",
        "convites_update_by_token",
      );
      expect(policy).toBeTruthy();
      expect(policy!).toMatch(/auth\.uid\(\)|auth\.role\(\)/);
    });
  });

  describe("Sensitive RPC functions", () => {
    it("registrar_nfe_entrada validates caller permission", () => {
      const func = extractFinalFunction(allContent, "registrar_nfe_entrada");
      if (!func) {
        return;
      }
      expect(func).toMatch(/can_access_empresa\s*\(\s*p_empresa_id\s*\)|auth\.uid\(\)/);
    });
  });

  describe("Privilege escalation protections", () => {
    it("perfis_usuario_write_by_empresa restricts role changes", () => {
      const policy = extractFinalPolicy(
        allContent,
        "public\\.perfis_usuario",
        "perfis_usuario_write_by_empresa",
      );
      if (!policy) {
        return;
      }
      expect(policy).toMatch(/role\s+in\s*\(\s*['"]admin['"]|superadmin/);
    });
  });
});
