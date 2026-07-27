/**
 * Utilitários de validação e formatação para campos de contato.
 * Telefone (fixo/celular brasileiro) e e-mail.
 */

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

// ─── Telefone ─────────────────────────────────────────────

/**
 * Aplica máscara de telefone brasileiro (fixo ou celular).
 * - 10 dígitos → (00) 0000-0000
 * - 11 dígitos → (00) 00000-0000
 */
export const maskPhone = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits.replace(/(\d{1,2})/, "($1");
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d{1,4})/, "($1) $2");
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");

  return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

/**
 * Valida se a string é um telefone brasileiro válido (10 ou 11 dígitos).
 * Retorna true se vazio (campo opcional) — a obrigatoriedade deve
 * ser controlada pelo formulário.
 */
export const isValidPhone = (value: string): boolean => {
  if (!value.trim()) return true; // campo opcional
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
};

// ─── E-mail ───────────────────────────────────────────────

/**
 * Regex simplificada mas robusta para validação de e-mail.
 * Cobre 99.9% dos endereços reais sem ser excessivamente permissiva.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Valida se a string é um e-mail válido.
 * Retorna true se vazio (campo opcional).
 */
export const isValidEmail = (value: string): boolean => {
  if (!value.trim()) return true; // campo opcional
  return EMAIL_REGEX.test(value.trim());
};

// ─── Salário / Moeda ──────────────────────────────────────

/**
 * Aplica máscara de moeda brasileira (R$) enquanto o usuário digita.
 * Entrada: dígitos puros → Saída: "1.234,56"
 */
export const maskCurrency = (value: string): string => {
  const digits = onlyDigits(value);
  if (!digits) return "";

  const num = parseInt(digits, 10);
  const formatted = (num / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatted;
};

/**
 * Converte string formatada em moeda para número.
 * "1.234,56" → 1234.56
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};
