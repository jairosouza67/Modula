export function userFriendlyError(context: string, error: unknown): string {
  const technical = error instanceof Error ? error.message : String(error);

  if (import.meta.env.DEV) {
    return `${context}: ${technical}`;
  }

  const message = technical.toLowerCase();

  if (
    message.includes("unique constraint") ||
    message.includes("duplicate key") ||
    message.includes("23505") ||
    message.includes("already exists")
  ) {
    return `${context}: registro duplicado. Verifique se os dados já não estão cadastrados.`;
  }

  if (
    message.includes("foreign key constraint") ||
    message.includes("violates foreign key") ||
    message.includes("23503") ||
    message.includes("is still referenced")
  ) {
    return `${context}: este registro está em uso e não pode ser removido ou alterado.`;
  }

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("42501") ||
    message.includes("new row violates row-level security")
  ) {
    return `${context}: você não tem permissão para realizar esta ação.`;
  }

  if (
    message.includes("jwt expired") ||
    message.includes("token is expired") ||
    message.includes("invalid jwt") ||
    message.includes("refresh_token_not_found") ||
    message.includes("session_not_found")
  ) {
    return `${context}: sua sessão expirou. Faça login novamente.`;
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch")
  ) {
    return `${context}: erro de conexão. Verifique sua internet e tente novamente.`;
  }

  return `${context}: não foi possível completar a operação. Tente novamente mais tarde.`;
}
