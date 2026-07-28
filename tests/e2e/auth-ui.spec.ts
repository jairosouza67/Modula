import { expect, test } from "@playwright/test";

test.describe("Tela de Login - UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("exibe formulário de login por padrão", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Entrar no ModulaAPP" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("navega para formulário de criar conta", async ({ page }) => {
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email-register")).toBeVisible();
    await expect(page.locator("#password-register")).toBeVisible();
    await expect(page.locator("#confirm-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });

  test("navega para formulário de recuperar senha", async ({ page }) => {
    await page.getByRole("button", { name: "Esqueci minha senha" }).click();

    await expect(page.getByRole("heading", { name: "Recuperar acesso" })).toBeVisible();
    await expect(page.locator("#email-forgot")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeVisible();
  });

  test("volta do formulário de criar conta para login", async ({ page }) => {
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();

    await page.getByRole("button", { name: "Já tenho conta" }).click();
    await expect(page.getByRole("heading", { name: "Entrar no ModulaAPP" })).toBeVisible();
  });

  test("volta do formulário de recuperar senha para login", async ({ page }) => {
    await page.getByRole("button", { name: "Esqueci minha senha" }).click();
    await expect(page.getByRole("heading", { name: "Recuperar acesso" })).toBeVisible();

    await page.getByRole("button", { name: "Voltar ao login" }).click();
    await expect(page.getByRole("heading", { name: "Entrar no ModulaAPP" })).toBeVisible();
  });

  test("exibe erro ao criar conta com senhas diferentes", async ({ page }) => {
    await page.getByRole("button", { name: "Criar conta" }).click();

    await page.locator("#name").fill("Usuário Teste");
    await page.locator("#email-register").fill("teste@exemplo.com");
    await page.locator("#password-register").fill("senha123");
    await page.locator("#confirm-password").fill("senha456");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("As senhas não conferem.")).toBeVisible();
  });

  test("exibe erro ao criar conta com senha curta", async ({ page }) => {
    await page.getByRole("button", { name: "Criar conta" }).click();

    await page.locator("#name").fill("Usuário Teste");
    await page.locator("#email-register").fill("teste@exemplo.com");
    await page.locator("#password-register").fill("123");
    await page.locator("#confirm-password").fill("123");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("A senha deve ter pelo menos 6 caracteres.")).toBeVisible();
  });

  test("fluxo de login com credenciais mock funciona", async ({ page }) => {
    await page.locator("#email").fill("admin@dev.local");
    await page.locator("#password").fill("REDACTED");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
