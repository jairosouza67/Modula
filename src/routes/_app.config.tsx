import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Shield, FileText } from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpCard } from "@/components/erp/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth/context";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/auth/types";
import { defaultCompanySettings, type CompanySettings } from "@/lib/settings/storage";
import {
  loadCompanySettings,
  loadPriceSettings,
  saveCompanySettings,
  savePriceSettings,
  type PriceSettings,
} from "@/lib/settings/repository";
import { isValidDocument, maskDocument, normalizeDocument } from "@/lib/documents/validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";

type PriceDraft = {
  tiposVidro: { label: string; value: string }[];
  processamentos: { label: string; value: string }[];
};

function CurrencyInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const fmtBRL = (val: string) => {
    const num = parseDraftValue(val);
    if (!Number.isFinite(num)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const normalize = (raw: string): string => {
    let cleaned = raw.replace(/[^0-9.,]/g, "");
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
    return cleaned;
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={isFocused ? value : fmtBRL(value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(normalize(e.target.value))}
    />
  );
}

const toDraft = (settings: PriceSettings): PriceDraft => ({
  tiposVidro: settings.tiposVidro.map((item) => ({
    label: item.label,
    value: String(item.value),
  })),
  processamentos: settings.processamentos.map((item) => ({
    label: item.label,
    value: String(item.value),
  })),
});

const parseDraftValue = (value: string): number => Number(value.replace(",", "."));

const parsePriceDraft = (draft: PriceDraft): PriceSettings | null => {
  const tiposVidro = draft.tiposVidro.map((item) => ({
    label: item.label,
    value: parseDraftValue(item.value),
  }));
  const processamentos = draft.processamentos.map((item) => ({
    label: item.label,
    value: parseDraftValue(item.value),
  }));

  const hasInvalidValue = [...tiposVidro, ...processamentos].some(
    (item) => !Number.isFinite(item.value) || item.value < 0,
  );
  if (hasInvalidValue) {
    return null;
  }

  return {
    tiposVidro,
    processamentos,
  };
};

export const Route = createFileRoute("/_app/config")({
  head: () => ({
    meta: [
      { title: "Configurações — Vidraçaria Ornamental" },
      { name: "description", content: "Parametrização do sistema para a empresa." },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { users, updateUserRole, provider, refreshUsers, session } = useAuth();
  const isCurrentUserSuperAdmin = session ? session.user.role === "superadmin" : false;
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [priceDraft, setPriceDraft] = useState<PriceDraft>(
    toDraft({ tiposVidro: [], processamentos: [] }),
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Configurações fiscais (Focus NFe)
  const [focusToken, setFocusToken] = useState("");
  const [focusAmbienteProducao, setFocusAmbienteProducao] = useState(false);
  const [isLoadingFiscal, setIsLoadingFiscal] = useState(false);
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const usersPromise = refreshUsers();
        const [nextCompanySettings, nextPriceSettings] = await Promise.all([
          loadCompanySettings(provider),
          loadPriceSettings(provider),
        ]);
        await usersPromise;

        if (!isActive) {
          return;
        }

        setCompanySettings(nextCompanySettings);
        setPriceDraft(toDraft(nextPriceSettings));

        // Carrega configurações fiscais
        try {
          const { data: fiscalData, error: fiscalError } = await supabase.functions.invoke(
            "config-fiscal",
            {
              method: "POST",
              body: { acao: "get", empresa_id: empresaId },
            },
          );

          if (!fiscalError && fiscalData?.success !== false) {
            setFocusToken(fiscalData?.token || "");
            setFocusAmbienteProducao(fiscalData?.ambiente === "producao");
          } else {
            console.warn("[ConfigPage] Erro ao carregar config fiscal:", fiscalError || fiscalData?.error);
          }
        } catch (fiscalErr) {
          if (isActive) {
            console.warn("[ConfigPage] Erro ao carregar config fiscal:", fiscalErr);
          }
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        toast.error(
          error instanceof Error ? error.message : "Não foi possível carregar as configurações.",
        );
      } finally {
        if (isActive) {
          setIsLoadingSettings(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isActive = false;
    };
  }, [provider, refreshUsers]);

  // Carrega configurações fiscais — efeito separado, executa só no mount
  useEffect(() => {
    let isActive = true;

    const loadFiscal = async () => {
      try {
        const { data: fiscalData, error: fiscalError } = await supabase.functions.invoke(
          "config-fiscal",
          {
            method: "POST",
            body: { acao: "get", empresa_id: empresaId },
          },
        );

        if (!isActive) return;

        if (!fiscalError && fiscalData?.success !== false) {
          setFocusToken(fiscalData?.token || "");
          setFocusAmbienteProducao(fiscalData?.ambiente === "producao");
        }
      } catch (fiscalErr) {
        // Silently ignore — token will remain empty if unavailable
      }
    };

    void loadFiscal();

    return () => {
      isActive = false;
    };
  }, []); // executa apenas no mount

  return (
    <>
      <PageHeader title="Configurações" subtitle="Parametrização do sistema" />

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="precos">Tabela de preços</TabsTrigger>
          <TabsTrigger value="fiscal">
            <FileText className="inline h-3 w-3 mr-1" /> Fiscal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-3">
          <ErpCard title="Dados da empresa">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Razão social</Label>
                <Input
                  value={companySettings.razaoSocial}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      razaoSocial: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Nome fantasia</Label>
                <Input
                  value={companySettings.nomeFantasia}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      nomeFantasia: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">CNPJ</Label>
                <Input
                  value={companySettings.cnpj}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      cnpj: maskDocument(event.target.value, "cnpj"),
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Certificado digital</Label>
                <Input
                  value={companySettings.certificadoDigital}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      certificadoDigital: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[10px] text-muted-foreground">Endereço</Label>
                <Input
                  value={companySettings.endereco}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      endereco: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Cidade / UF</Label>
                <Input
                  value={companySettings.cidade}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      cidade: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder="Livramento de Nossa Senhora — BA"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Telefone(s)</Label>
                <Input
                  value={companySettings.telefone}
                  onChange={(event) =>
                    setCompanySettings((current) => ({
                      ...current,
                      telefone: event.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder="(77) 9.9995-9280 / (77) 3444-1022"
                />
              </div>
            </div>

            {/* Seção de Endereço Fiscal para NF-e */}
            <div className="mt-4 border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                Endereço Fiscal (NF-e)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <Label className="text-[10px] text-muted-foreground">Logradouro</Label>
                  <Input
                    value={companySettings.logradouro}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        logradouro: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="Rua / Avenida"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Número</Label>
                  <Input
                    value={companySettings.numeroEndereco}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        numeroEndereco: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Complemento</Label>
                  <Input
                    value={companySettings.complemento}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        complemento: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="Sala, galpão..."
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Bairro</Label>
                  <Input
                    value={companySettings.bairro}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        bairro: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">CEP</Label>
                  <Input
                    value={companySettings.cep}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        cep: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">UF</Label>
                  <Input
                    value={companySettings.uf}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        uf: event.target.value.toUpperCase(),
                      }))
                    }
                    className="h-8 text-xs uppercase"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Código IBGE</Label>
                  <Input
                    value={companySettings.codigoMunicipio}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        codigoMunicipio: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="2919504"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Seção de Dados Fiscais */}
            <div className="mt-4 border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                Dados Fiscais
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Inscrição Estadual</Label>
                  <Input
                    value={companySettings.inscricaoEstadual}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        inscricaoEstadual: event.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="IE da empresa"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Regime Tributário (CRT)</Label>
                  <select
                    value={companySettings.crt}
                    onChange={(event) =>
                      setCompanySettings((current) => ({
                        ...current,
                        crt: event.target.value,
                      }))
                    }
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="1">1 — Simples Nacional</option>
                    <option value="2">2 — Simples Nacional (excesso)</option>
                    <option value="3">3 — Regime Normal</option>
                  </select>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              disabled={isLoadingSettings}
              className="mt-3 text-xs"
              onClick={async () => {
                if (
                  companySettings.cnpj &&
                  !isValidDocument(normalizeDocument(companySettings.cnpj), "cnpj")
                ) {
                  toast.error("CNPJ inválido. Verifique os dígitos.");
                  return;
                }
                try {
                  await saveCompanySettings(provider, companySettings);
                  toast.success("Dados da empresa salvos.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível salvar os dados da empresa.",
                  );
                }
              }}
            >
              Salvar
            </Button>
          </ErpCard>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-3">
          <ErpCard title="Usuários e permissões">
            {!isCurrentUserSuperAdmin && (
              <div className="mb-2 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-[11px] text-warning">
                Apenas o usuário-chave do sistema pode promover ou restringir acesso dos demais
                funcionários.
              </div>
            )}
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/60 text-[10px] text-muted-foreground text-left">
                  <th className="py-1.5">Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSuperAdminUser = user.role === "superadmin";
                  const canEditRole = isCurrentUserSuperAdmin && !isSuperAdminUser;
                  return (
                    <tr key={user.id} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5">
                        {user.name}
                        {isSuperAdminUser && (
                          <span className="ml-1 text-[9px] font-medium text-primary">
                            (usuário-chave)
                          </span>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {canEditRole ? (
                          <select
                            className="h-7 rounded-md border border-input bg-background px-2 text-[11px]"
                            value={user.role}
                            onChange={async (event) => {
                              const role = event.target.value as UserRole;
                              try {
                                await updateUserRole(user.id, role);
                                toast.success(
                                  `Perfil de ${user.name} atualizado para ${ROLE_LABELS[role]}.`,
                                );
                              } catch (error) {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Não foi possível atualizar o perfil.",
                                );
                              }
                            }}
                          >
                            {USER_ROLES.filter((r) => r !== "superadmin").map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {ROLE_LABELS[user.role]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ErpCard>
        </TabsContent>

        <TabsContent value="precos" className="mt-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <ErpCard title="Preço por m² — tipos de vidro">
              <div className="space-y-2">
                {priceDraft.tiposVidro.map((item, index) => (
                  <div key={item.label} className="grid grid-cols-[1fr_120px] gap-2 items-center">
                    <span className="text-[11px]">{item.label}</span>
                    <CurrencyInput
                      className="h-8 text-xs text-right"
                      value={item.value}
                      onChange={(nextValue) =>
                        setPriceDraft((current) => ({
                          ...current,
                          tiposVidro: current.tiposVidro.map((entry, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...entry,
                                  value: nextValue,
                                }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </ErpCard>

            <ErpCard title="Custo por processamento">
              <div className="space-y-2">
                {priceDraft.processamentos.map((item, index) => (
                  <div key={item.label} className="grid grid-cols-[1fr_120px] gap-2 items-center">
                    <span className="text-[11px]">{item.label}</span>
                    <CurrencyInput
                      className="h-8 text-xs text-right"
                      value={item.value}
                      onChange={(nextValue) =>
                        setPriceDraft((current) => ({
                          ...current,
                          processamentos: current.processamentos.map((entry, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...entry,
                                  value: nextValue,
                                }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                disabled={isLoadingSettings}
                className="mt-3 text-xs"
                onClick={async () => {
                  const parsedSettings = parsePriceDraft(priceDraft);
                  if (!parsedSettings) {
                    toast.error("Preencha a tabela de preços com valores numéricos válidos.");
                    return;
                  }
                  try {
                    await savePriceSettings(provider, parsedSettings);
                    toast.success("Tabela de preços salva.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Não foi possível salvar a tabela de preços.",
                    );
                  }
                }}
              >
                Salvar tabela de preços
              </Button>
            </ErpCard>
          </div>
        </TabsContent>

        <TabsContent value="fiscal" className="mt-3">
          <ErpCard title="Configuração Fiscal — Focus NFe">
            <div className="rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-[11px] text-warning mb-3">
              <Shield className="inline h-3 w-3 mr-1" />O token é armazenado de forma segura no
              banco (service_role) e nunca é exposto ao navegador.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-[10px] text-muted-foreground">Token Focus NFe</Label>
                <Input
                  type="password"
                  value={focusToken}
                  onChange={(event) => setFocusToken(event.target.value)}
                  placeholder="Cole aqui o token fornecido pela Focus NFe"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/60 p-3 sm:col-span-2">
                <div>
                  <p className="text-xs font-medium">Ambiente de produção</p>
                  <p className="text-[10px] text-muted-foreground">
                    {focusAmbienteProducao
                      ? "As notas serão transmitidas para a SEFAZ real."
                      : "As notas serão enviadas para ambiente de homologação/testes."}
                  </p>
                </div>
                <Switch
                  checked={focusAmbienteProducao}
                  onCheckedChange={setFocusAmbienteProducao}
                />
              </div>
            </div>

            <Button
              size="sm"
              disabled={isLoadingFiscal}
              className="mt-3 text-xs"
              onClick={async () => {
                setIsLoadingFiscal(true);
                try {
                  const { data: fiscalSaveData, error: fiscalSaveErr } = await supabase.functions.invoke("config-fiscal", {
                    method: "POST",
                    body: {
                      acao: "save",
                      empresa_id: empresaId,
                      token: focusToken,
                      ambiente: focusAmbienteProducao ? "producao" : "homologacao",
                    },
                  });

                  if (fiscalSaveErr) throw fiscalSaveErr;
                  if (fiscalSaveData && fiscalSaveData.success === false) {
                    throw new Error(fiscalSaveData.error || "Erro ao salvar configuração fiscal");
                  }
                  toast.success("Configuração fiscal salva.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível salvar a configuração fiscal.",
                  );
                } finally {
                  setIsLoadingFiscal(false);
                }
              }}
            >
              <Save className="mr-1 h-3 w-3" />
              {isLoadingFiscal ? "Salvando..." : "Salvar configuração fiscal"}
            </Button>
          </ErpCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
