export const getDefaultEmpresaId = (): string => {
  const configuredEmpresaId = import.meta.env.VITE_DEFAULT_EMPRESA_ID;
  const normalizedEmpresaId = configuredEmpresaId?.trim();

  if (!normalizedEmpresaId || normalizedEmpresaId.length === 0) {
    throw new Error("VITE_DEFAULT_EMPRESA_ID não configurado. Defina no .env.");
  }

  return normalizedEmpresaId;
};
