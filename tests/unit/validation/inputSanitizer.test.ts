import { describe, it, expect, vi } from "vitest";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";

describe("sanitizeTextFields — integração com validateInput", () => {
  it("deixa passar dados sem campos textuais", () => {
    const data = { id: 1, ativo: true };
    expect(sanitizeTextFields(data, ["nome"])).toBe(data);
  });

  it("aceita strings seguras nos campos informados", () => {
    const data = {
      nome: "Maria Vidros ME",
      cidade: "São Paulo",
      email: "maria@vidros.com.br",
    };
    expect(() => sanitizeTextFields(data, ["nome", "cidade", "email"])).not.toThrow();
    expect(sanitizeTextFields(data, ["nome"])).toBe(data);
  });

  it("ignora campos não listados mesmo se perigosos", () => {
    const data = { nome: "Cliente OK", payload: "<script>alert(1)</script>" };
    expect(() => sanitizeTextFields(data, ["nome"])).not.toThrow();
  });

  it("ignora campos não-string (número, null, objeto, array)", () => {
    const data = { nome: null, quantidade: 10, tags: ["a"], meta: { x: 1 } };
    expect(() => sanitizeTextFields(data, ["nome", "quantidade", "tags", "meta"])).not.toThrow();
  });

  it("lança erro em campo com padrão de XSS", () => {
    const data = { nome: "<script>alert('xss')</script>" };
    expect(() => sanitizeTextFields(data, ["nome"])).toThrow(/Campo inválido \(nome\)/);
    expect(() => sanitizeTextFields(data, ["nome"])).toThrow(/XSS/);
  });

  it("lança erro em campo com padrão de SQL Injection", () => {
    const data = { documento: "1' OR '1'='1" };
    expect(() => sanitizeTextFields(data, ["documento"])).toThrow(/SQL Injection/);
  });

  it("inclui o nome do campo na mensagem de erro", () => {
    const data = { email: "javascript:alert(1)", nome: "ok" };
    expect(() => sanitizeTextFields(data, ["email"])).toThrow(/Campo inválido \(email\)/);
  });

  it("não muta o objeto de entrada", () => {
    const data = { nome: "Cliente", cidade: "Curitiba" };
    const snapshot = { ...data };
    sanitizeTextFields(data, ["nome", "cidade"]);
    expect(data).toEqual(snapshot);
  });

  it("lança no primeiro campo inválido encontrado", () => {
    const data = {
      nome: "<script>x</script>",
      cidade: "<script>y</script>",
    };
    expect(() => sanitizeTextFields(data, ["nome", "cidade"])).toThrow(/Campo inválido \(nome\)/);
  });

  it("aceita array de nomes de campos vazio (no-op)", () => {
    const data = { nome: "<script>alert(1)</script>" };
    expect(() => sanitizeTextFields(data, [])).not.toThrow();
  });
});