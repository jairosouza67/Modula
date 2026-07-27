import type { AuthProviderType } from "@/lib/auth/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import {
  defaultCompanySettings,
  getCompanySettings as getLocalCompanySettings,
  saveCompanySettings as saveLocalCompanySettings,
  type CompanySettings,
} from "./storage";

/**
 * Item de preço para configurações.
 * Os preços de produtos agora vêm da tabela `produtos` via useProdutosOrcamento.
 * Este tipo é mantido para compatibilidade com a tela de configurações.
 */
export interface PriceItem {
  label: string;
  value: number;
}

export interface PriceSettings {
  tiposVidro: PriceItem[];
  processamentos: PriceItem[];
}

const CATEGORIAS_VIDRO = ["vidro", "kit", "ferragem", "servico"];
const CODIGOS_PROCESSAMENTO = ["JAT", "AD", "LAP", "BST", "FUR"];

const toCompanySettingsFromSupabase = async (): Promise<CompanySettings> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const { data, error } = await supabase
    .from("empresas")
    .select(
      "razao_social, nome_fantasia, cnpj, endereco, cidade, telefone, certificado_digital, logradouro, numero_endereco, complemento, bairro, cep, uf, inscricao_estadual, codigo_municipio, crt",
    )
    .eq("id", empresaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return defaultCompanySettings;
  }

  return {
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    cnpj: data.cnpj,
    endereco: data.endereco,
    cidade: data.cidade ?? defaultCompanySettings.cidade,
    telefone: data.telefone ?? defaultCompanySettings.telefone,
    certificadoDigital: data.certificado_digital,
    // Novos campos fiscais
    logradouro: data.logradouro ?? defaultCompanySettings.logradouro,
    numeroEndereco: data.numero_endereco ?? defaultCompanySettings.numeroEndereco,
    complemento: data.complemento ?? defaultCompanySettings.complemento,
    bairro: data.bairro ?? defaultCompanySettings.bairro,
    cep: data.cep ?? defaultCompanySettings.cep,
    uf: data.uf ?? defaultCompanySettings.uf,
    inscricaoEstadual: data.inscricao_estadual ?? defaultCompanySettings.inscricaoEstadual,
    codigoMunicipio: data.codigo_municipio?.toString() ?? defaultCompanySettings.codigoMunicipio,
    crt: data.crt?.toString() ?? defaultCompanySettings.crt,
  };
};

/**
 * Busca preços da tabela `produtos` do Supabase.
 * Substitui a antiga leitura de `config_precos` / mock.
 */
const toPriceSettingsFromSupabase = async (): Promise<PriceSettings> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const { data, error } = await supabase
    .from("produtos")
    .select("codigo, descricao, valor_venda, categoria")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("descricao", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return { tiposVidro: [], processamentos: [] };
  }

  const tiposVidro: PriceItem[] = [];
  const processamentos: PriceItem[] = [];

  for (const item of data) {
    const parsedValue = Number(item.valor_venda);
    if (!Number.isFinite(parsedValue)) continue;

    const priceItem: PriceItem = {
      label: item.descricao,
      value: parsedValue,
    };

    if (
      item.categoria === "processamento" ||
      CODIGOS_PROCESSAMENTO.includes(item.codigo)
    ) {
      processamentos.push(priceItem);
    } else if (CATEGORIAS_VIDRO.includes(item.categoria)) {
      tiposVidro.push(priceItem);
    }
  }

  return { tiposVidro, processamentos };
};

const saveCompanySettingsToSupabase = async (settings: CompanySettings): Promise<void> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const { error } = await supabase.from("empresas").upsert(
    {
      id: empresaId,
      razao_social: settings.razaoSocial,
      nome_fantasia: settings.nomeFantasia,
      cnpj: settings.cnpj,
      endereco: settings.endereco,
      cidade: settings.cidade,
      telefone: settings.telefone,
      certificado_digital: settings.certificadoDigital,
      // Novos campos fiscais
      logradouro: settings.logradouro,
      numero_endereco: settings.numeroEndereco,
      complemento: settings.complemento,
      bairro: settings.bairro,
      cep: settings.cep,
      uf: settings.uf,
      inscricao_estadual: settings.inscricaoEstadual,
      codigo_municipio: settings.codigoMunicipio ? Number(settings.codigoMunicipio) : null,
      crt: settings.crt ? Number(settings.crt) : 1,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Salva preços alterando a tabela `produtos` no Supabase.
 */
const savePriceSettingsToSupabase = async (settings: PriceSettings): Promise<void> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  // Atualizar valor_compra dos produtos com base no valor informado
  // Usa margem_lucro padrão 0.46 para vidros, 0 para processamento
  for (const item of [...settings.tiposVidro, ...settings.processamentos]) {
    const isProc = settings.processamentos.includes(item);
    const margem = isProc ? 0 : 0.46;
    const valorCompra = margem > 0 ? Number((item.value / (1 + margem)).toFixed(2)) : item.value;

    const { error } = await supabase
      .from("produtos")
      .update({ valor_compra: valorCompra, updated_at: new Date().toISOString() })
      .eq("empresa_id", empresaId)
      .eq("descricao", item.label);

    if (error) {
      throw new Error(`Erro ao salvar preço de "${item.label}": ${error.message}`);
    }
  }
};

export const loadCompanySettings = async (provider: AuthProviderType): Promise<CompanySettings> => {
  if (provider === "supabase") {
    return toCompanySettingsFromSupabase();
  }

  return getLocalCompanySettings();
};

export const saveCompanySettings = async (
  provider: AuthProviderType,
  settings: CompanySettings,
): Promise<void> => {
  if (provider === "supabase") {
    await saveCompanySettingsToSupabase(settings);
    return;
  }

  saveLocalCompanySettings(settings);
};

export const loadPriceSettings = async (provider: AuthProviderType): Promise<PriceSettings> => {
  if (provider === "supabase") {
    return toPriceSettingsFromSupabase();
  }

  // Fallback: sem mock, retorna vazio
  return { tiposVidro: [], processamentos: [] };
};

export const savePriceSettings = async (
  provider: AuthProviderType,
  settings: PriceSettings,
): Promise<void> => {
  if (provider === "supabase") {
    await savePriceSettingsToSupabase(settings);
    return;
  }
};
