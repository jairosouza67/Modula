import { getSupabaseBrowserClient } from "./client";
import { getDefaultEmpresaId } from "./company";
import { QueryClient } from "@tanstack/react-query";

const CLIENTES_KEY = "vidraerp:crm:clientes";

export async function migrateLocalClientesToSupabase(queryClient?: QueryClient) {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const raw = window.localStorage.getItem(CLIENTES_KEY);
  if (!raw) return { success: true, count: 0, message: "Nenhum cliente local encontrado." };

  try {
    const localClientes = JSON.parse(raw);
    if (!Array.isArray(localClientes) || localClientes.length === 0) {
      return { success: true, count: 0, message: "Lista de clientes locais vazia." };
    }

    // Filter out already deleted or invalid ones if necessary
    const toMigrate = localClientes.filter(c => !c.deletedAt);

    if (toMigrate.length === 0) {
      return { success: true, count: 0, message: "Nenhum cliente ativo para migrar." };
    }

    // Map to Supabase schema
    const payload = toMigrate.map(c => ({
      empresa_id: empresaId,
      nome: c.nome,
      documento: c.documento,
      tipo_documento: c.tipoDocumento,
      contato: c.contato,
      segmento: c.segmento,
      volume_total: c.volumeTotal || 0,
      ultimo_contato: c.ultimoContato || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("clientes")
      .insert(payload)
      .select();

    if (error) throw error;

    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ["clientes", empresaId] });
    }

    return { 
      success: true, 
      count: data?.length || 0, 
      message: `${data?.length || 0} clientes migrados com sucesso!` 
    };
  } catch (error: any) {
    console.error("Erro na migração:", error);
    return { success: false, count: 0, message: "Erro ao migrar: " + error.message };
  }
}
