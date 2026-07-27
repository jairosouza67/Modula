import { expect, test } from "@playwright/test";

const userEmail = process.env.E2E_SUPABASE_EMAIL;
const userPassword = process.env.E2E_SUPABASE_PASSWORD;
const runWithRealSupabase = process.env.E2E_SUPABASE_ENABLED === "true";

test.describe("Auth - Supabase real", () => {
  test.skip(
    !runWithRealSupabase || !userEmail || !userPassword,
    "Defina E2E_SUPABASE_ENABLED=true, E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar o fluxo real.",
  );

  test("login e logout com sessão persistida", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar no Vidraçaria TOP" })).toBeVisible();

    await page.locator("#email").fill(userEmail ?? "");
    await page.locator("#password").fill(userPassword ?? "");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("#dashboard-btn-alertas")).toBeVisible();

    const storedSession = await page.evaluate(() => window.localStorage.getItem("vidraerp:auth:session"));
    expect(storedSession).toBeTruthy();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    const clearedSession = await page.evaluate(() => window.localStorage.getItem("vidraerp:auth:session"));
    expect(clearedSession).toBeNull();
  });
});
