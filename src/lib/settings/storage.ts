import { readJson, writeJson, isBrowser } from "@/lib/utils/localStorage";

const COMPANY_SETTINGS_KEY = "vidraerp:settings:company";

export interface CompanySettings {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  telefone: string;
  certificadoDigital: string;
  // Novos campos fiscais
  logradouro: string;
  numeroEndereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  inscricaoEstadual: string;
  codigoMunicipio: string;
  crt: string;
}

export const defaultCompanySettings: CompanySettings = {
  razaoSocial: "Vidraçaria Ornamental Ltda",
  nomeFantasia: "Vidraçaria Ornamental",
  cnpj: "14.032.864/0001-08",
  endereco: "Av. Gil Ferreira Pessoa, Nº 70 - Matinha",
  cidade: "Livramento de Nossa Senhora - BA",
  telefone: "(77) 9.9995-9280 / (77) 3444-1022 / (77) 9.8145-5902",
  certificadoDigital: "A1 — válido até 12/2026",
  // Novos campos fiscais
  logradouro: "Avenida Gil Ferreira Pessoa",
  numeroEndereco: "70",
  complemento: "Galpão",
  bairro: "Taquari",
  cep: "46140000",
  uf: "BA",
  inscricaoEstadual: "096918958",
  codigoMunicipio: "2919504",
  crt: "1",
};

export const getCompanySettings = (): CompanySettings =>
  readJson<CompanySettings>(COMPANY_SETTINGS_KEY) ?? defaultCompanySettings;

export const saveCompanySettings = (settings: CompanySettings): void => {
  writeJson(COMPANY_SETTINGS_KEY, settings);
};
