export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type DatabaseUserRole =
  | "superadmin"
  | "admin"
  | "gestor"
  | "vendedor"
  | "tecnico"
  | "financeiro";

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome_fantasia: string;
          razao_social: string;
          cnpj: string;
          endereco: string;
          certificado_digital: string;
          inscricao_estadual: string | null;
          codigo_municipio: number | null;
          crt: number | null;
          cep: string | null;
          bairro: string | null;
          logradouro: string | null;
          numero_endereco: string | null;
          complemento: string | null;
          cidade: string | null;
          uf: string | null;
          telefone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome_fantasia: string;
          razao_social: string;
          cnpj: string;
          endereco: string;
          certificado_digital?: string;
          inscricao_estadual?: string | null;
          codigo_municipio?: number | null;
          crt?: number | null;
          cep?: string | null;
          bairro?: string | null;
          logradouro?: string | null;
          numero_endereco?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          uf?: string | null;
          telefone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome_fantasia?: string;
          razao_social?: string;
          cnpj?: string;
          endereco?: string;
          certificado_digital?: string;
          inscricao_estadual?: string | null;
          codigo_municipio?: number | null;
          crt?: number | null;
          cep?: string | null;
          bairro?: string | null;
          logradouro?: string | null;
          numero_endereco?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          uf?: string | null;
          telefone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      perfis_usuario: {
        Row: {
          id: string;
          empresa_id: string;
          user_id: string;
          nome: string;
          email: string;
          role: DatabaseUserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          user_id: string;
          nome: string;
          email: string;
          role: DatabaseUserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          user_id?: string;
          nome?: string;
          email?: string;
          role?: DatabaseUserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perfis_usuario_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      config_precos: {
        Row: {
          id: string;
          empresa_id: string;
          categoria: "vidro" | "processamento";
          descricao: string;
          valor: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          categoria: "vidro" | "processamento";
          descricao: string;
          valor: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          categoria?: "vidro" | "processamento";
          descricao?: string;
          valor?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "config_precos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          documento: string;
          tipo_documento: "cpf" | "cnpj";
          contato: string;
          segmento: "Construtoras" | "Residencial" | "Arquitetos" | "Comercial";
          ultimo_contato: string;
          volume_total: number;
          email: string | null;
          telefone: string | null;
          endereco: string | null;
          cep: string | null;
          bairro: string | null;
          uf: string | null;
          numero_endereco: string | null;
          complemento: string | null;
          cidade: string | null;
          representante: string | null;
          referencia: string | null;
          codigo_municipio: number | null;
          inscricao_estadual: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          documento: string;
          tipo_documento: "cpf" | "cnpj";
          contato: string;
          segmento: "Construtoras" | "Residencial" | "Arquitetos" | "Comercial";
          ultimo_contato?: string;
          volume_total?: number;
          email?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          cep?: string | null;
          bairro?: string | null;
          uf?: string | null;
          numero_endereco?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          representante?: string | null;
          referencia?: string | null;
          codigo_municipio?: number | null;
          inscricao_estadual?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          documento?: string;
          tipo_documento?: "cpf" | "cnpj";
          contato?: string;
          segmento?: "Construtoras" | "Residencial" | "Arquitetos" | "Comercial";
          ultimo_contato?: string;
          volume_total?: number;
          email?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          cep?: string | null;
          bairro?: string | null;
          uf?: string | null;
          numero_endereco?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          representante?: string | null;
          referencia?: string | null;
          codigo_municipio?: number | null;
          inscricao_estadual?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedores: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cnpj: string;
          contato: string;
          categoria: string;
          dados_fiscais: string;
          dados_bancarios: string;
          a_pagar: number;
          vencimento: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cnpj: string;
          contato: string;
          categoria: string;
          dados_fiscais?: string;
          dados_bancarios?: string;
          a_pagar?: number;
          vencimento?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          cnpj?: string;
          contato?: string;
          categoria?: string;
          dados_fiscais?: string;
          dados_bancarios?: string;
          a_pagar?: number;
          vencimento?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      orcamentos: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          numero: string;
          descricao: string;
          itens: Json;
          area_total: number;
          valor_total: number;
          status: "Aberto" | "Aprovado" | "Expirado" | "Rejeitado";
          data_validade: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id?: string | null;
          numero: string;
          descricao: string;
          itens?: Json;
          area_total?: number;
          valor_total?: number;
          status: "Aberto" | "Aprovado" | "Expirado" | "Rejeitado";
          data_validade: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          cliente_id?: string | null;
          numero?: string;
          descricao?: string;
          itens?: Json;
          area_total?: number;
          valor_total?: number;
          status?: "Aberto" | "Aprovado" | "Expirado" | "Rejeitado";
          data_validade?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orcamentos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      ordens_servico: {
        Row: {
          id: string;
          empresa_id: string;
          orcamento_id: string;
          cliente_id: string | null;
          tecnico_id: string | null;
          numero: string;
          status: "Na Fila" | "Em Producao" | "Instalacao" | "Concluido";
          data_previsao: string | null;
          hora_previsao: string | null;
          status_instalacao: "Agendado" | "Em Rota" | "Concluido" | null;
          endereco_instalacao: string | null;
          itens: Json;
          is_atrasada: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          orcamento_id: string;
          cliente_id?: string | null;
          tecnico_id?: string | null;
          numero: string;
          status: "Na Fila" | "Em Producao" | "Instalacao" | "Concluido";
          data_previsao?: string | null;
          hora_previsao?: string | null;
          status_instalacao?: "Agendado" | "Em Rota" | "Concluido" | null;
          endereco_instalacao?: string | null;
          itens?: Json;
          is_atrasada?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          orcamento_id?: string;
          cliente_id?: string | null;
          tecnico_id?: string | null;
          numero?: string;
          status?: "Na Fila" | "Em Producao" | "Instalacao" | "Concluido";
          data_previsao?: string | null;
          hora_previsao?: string | null;
          status_instalacao?: "Agendado" | "Em Rota" | "Concluido" | null;
          endereco_instalacao?: string | null;
          itens?: Json;
          is_atrasada?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ordens_servico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_itens: {
        Row: {
          id: string;
          empresa_id: string;
          codigo: string;
          descricao: string;
          categoria: "Chapas" | "Ferragens" | "Perfis" | "Consumíveis" | "Outros";
          unidade: string;
          quantidade: number;
          estoque_minimo: number;
          custo_unitario: number;
          produto_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          codigo: string;
          descricao: string;
          categoria: "Chapas" | "Ferragens" | "Perfis" | "Consumíveis" | "Outros";
          unidade?: string;
          quantidade?: number;
          estoque_minimo?: number;
          custo_unitario?: number;
          produto_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          codigo?: string;
          descricao?: string;
          categoria?: "Chapas" | "Ferragens" | "Perfis" | "Consumíveis" | "Outros";
          unidade?: string;
          quantidade?: number;
          estoque_minimo?: number;
          custo_unitario?: number;
          produto_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_itens_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_itens_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
      estoque_movimentacoes: {
        Row: {
          id: string;
          empresa_id: string;
          item_id: string;
          tipo: "Entrada" | "Saída" | "Devolução" | "Ajuste";
          quantidade: number;
          os_referencia: string | null;
          observacao: string | null;
          usuario_id: string | null;
          orcamento_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          item_id: string;
          tipo: "Entrada" | "Saída" | "Devolução" | "Ajuste";
          quantidade: number;
          os_referencia?: string | null;
          observacao?: string | null;
          usuario_id?: string | null;
          orcamento_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          item_id?: string;
          tipo?: "Entrada" | "Saída" | "Devolução" | "Ajuste";
          quantidade?: number;
          os_referencia?: string | null;
          observacao?: string | null;
          usuario_id?: string | null;
          orcamento_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estoque_movimentacoes_orcamento_id_fkey";
            columns: ["orcamento_id"];
            isOneToOne: false;
            referencedRelation: "orcamentos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos_compra: {
        Row: {
          id: string;
          empresa_id: string;
          numero: string;
          fornecedor_id: string;
          condicao_pagamento_id: string | null;
          forma_pagamento_id: string | null;
          previsao_entrega: string;
          observacoes: string | null;
          status:
            | "emissao"
            | "aguardando_liberacao"
            | "autorizado"
            | "enviado_fornecedor"
            | "previsao_confirmada"
            | "em_producao"
            | "em_transporte"
            | "concluido";
          status_liberacao: "pendente" | "liberado" | "reprovado" | "revisao";
          justificativa_reprovacao: string | null;
          limite_liberacao: number;
          valor_total: number;
          area_total_m2: number;
          qtd_total_pecas: number;
          data_conclusao: string | null;
          criado_por: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          numero: string;
          fornecedor_id: string;
          condicao_pagamento_id?: string | null;
          forma_pagamento_id?: string | null;
          previsao_entrega: string;
          observacoes?: string | null;
          status?:
            | "emissao"
            | "aguardando_liberacao"
            | "autorizado"
            | "enviado_fornecedor"
            | "previsao_confirmada"
            | "em_producao"
            | "em_transporte"
            | "concluido";
          status_liberacao?: "pendente" | "liberado" | "reprovado" | "revisao";
          justificativa_reprovacao?: string | null;
          limite_liberacao?: number;
          valor_total?: number;
          area_total_m2?: number;
          qtd_total_pecas?: number;
          data_conclusao?: string | null;
          criado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          numero?: string;
          fornecedor_id?: string;
          condicao_pagamento_id?: string | null;
          forma_pagamento_id?: string | null;
          previsao_entrega?: string;
          observacoes?: string | null;
          status?:
            | "emissao"
            | "aguardando_liberacao"
            | "autorizado"
            | "enviado_fornecedor"
            | "previsao_confirmada"
            | "em_producao"
            | "em_transporte"
            | "concluido";
          status_liberacao?: "pendente" | "liberado" | "reprovado" | "revisao";
          justificativa_reprovacao?: string | null;
          limite_liberacao?: number;
          valor_total?: number;
          area_total_m2?: number;
          qtd_total_pecas?: number;
          data_conclusao?: string | null;
          criado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      romaneios: {
        Row: {
          id: string;
          empresa_id: string;
          pedido_compra_id: string;
          numero_nfe: string | null;
          numero_oe: string | null;
          data_emissao: string;
          data_recebimento: string | null;
          status: "pendente" | "em_conferencia" | "concluido" | "divergencia";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          pedido_compra_id: string;
          numero_nfe?: string | null;
          numero_oe?: string | null;
          data_emissao: string;
          data_recebimento?: string | null;
          status?: "pendente" | "em_conferencia" | "concluido" | "divergencia";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          pedido_compra_id?: string;
          numero_nfe?: string | null;
          numero_oe?: string | null;
          data_emissao?: string;
          data_recebimento?: string | null;
          status?: "pendente" | "em_conferencia" | "concluido" | "divergencia";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categorias_financeiras: {
        Row: {
          id: string;
          empresa_id: string;
          parent_id: string | null;
          codigo: string;
          nome: string;
          tipo: "RECEITA" | "DESPESA" | "CUSTO";
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          parent_id?: string | null;
          codigo: string;
          nome: string;
          tipo: "RECEITA" | "DESPESA" | "CUSTO";
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          parent_id?: string | null;
          codigo?: string;
          nome?: string;
          tipo?: "RECEITA" | "DESPESA" | "CUSTO";
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contas_bancarias: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          tipo: "BANCO" | "CAIXA" | "APLICAÇÃO";
          saldo_inicial: number;
          saldo_atual: number;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          tipo: "BANCO" | "CAIXA" | "APLICAÇÃO";
          saldo_inicial?: number;
          saldo_atual?: number;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          tipo?: "BANCO" | "CAIXA" | "APLICAÇÃO";
          saldo_inicial?: number;
          saldo_atual?: number;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lancamentos: {
        Row: {
          id: string;
          empresa_id: string;
          conta_id: string;
          categoria_id: string;
          data_pagamento: string;
          valor: number;
          tipo: "ENTRADA" | "SAIDA";
          descricao: string;
          documento_ref: string | null;
          conciliado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          conta_id: string;
          categoria_id: string;
          data_pagamento: string;
          valor: number;
          tipo: "ENTRADA" | "SAIDA";
          descricao: string;
          documento_ref?: string | null;
          conciliado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          conta_id?: string;
          categoria_id?: string;
          data_pagamento?: string;
          valor?: number;
          tipo?: "ENTRADA" | "SAIDA";
          descricao?: string;
          documento_ref?: string | null;
          conciliado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contas_pagar_receber: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          fornecedor_id: string | null;
          categoria_id: string;
          data_vencimento: string;
          data_competencia: string;
          valor_previsto: number;
          valor_pago: number;
          status: "PENDENTE" | "PAGO" | "CANCELADO" | "ATRASADO";
          lancamento_id: string | null;
          observacoes: string | null;
          ordem_servico_id: string | null;
          parcela: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id?: string | null;
          fornecedor_id?: string | null;
          categoria_id: string;
          data_vencimento: string;
          data_competencia?: string;
          valor_previsto: number;
          valor_pago?: number;
          status?: "PENDENTE" | "PAGO" | "CANCELADO" | "ATRASADO";
          lancamento_id?: string | null;
          observacoes?: string | null;
          ordem_servico_id?: string | null;
          parcela?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          cliente_id?: string | null;
          fornecedor_id?: string | null;
          categoria_id?: string;
          data_vencimento?: string;
          data_competencia?: string;
          valor_previsto?: number;
          valor_pago?: number;
          status?: "PENDENTE" | "PAGO" | "CANCELADO" | "ATRASADO";
          lancamento_id?: string | null;
          observacoes?: string | null;
          ordem_servico_id?: string | null;
          parcela?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      logs_auditoria: {
        Row: {
          id: string;
          empresa_id: string;
          usuario_id: string;
          acao: string;
          recurso_id: string | null;
          detalhes: Json;
          severidade: "low" | "medium" | "high" | "critical";
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          usuario_id: string;
          acao: string;
          recurso_id?: string | null;
          detalhes?: Json;
          severidade: "low" | "medium" | "high" | "critical";
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          usuario_id?: string;
          acao?: string;
          recurso_id?: string | null;
          detalhes?: Json;
          severidade?: "low" | "medium" | "high" | "critical";
          created_at?: string;
        };
        Relationships: [];
      };
      nfe_saida: {
        Row: {
          id: string;
          empresa_id: string;
          os_id: string;
          numero: string;
          serie: string;
          chave_acesso: string | null;
          valor_total: number;
          valor_impostos: number | null;
          status: "EMITIDA" | "CANCELADA" | "EM_PROCESSAMENTO" | "DENEGADA";
          xml_path: string | null;
          protocolo_autorizacao: string | null;
          xml_autorizado: string | null;
          xml_cancelamento: string | null;
          focus_nfe_ref: string | null;
          danfe_url: string | null;
          data_autorizacao: string | null;
          motivo_rejeicao: string | null;
          forma_pagamento: string | null;
          cliente_nome: string | null;
          cliente_documento: string | null;
          cliente_email: string | null;
          descricao_itens: string | null;
          itens: Json;
          email_enviado: boolean | null;
          email_enviado_em: string | null;
          modalidade_frete: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          os_id: string;
          numero: string;
          serie?: string;
          chave_acesso?: string | null;
          valor_total: number;
          valor_impostos?: number | null;
          status?: "EMITIDA" | "CANCELADA" | "EM_PROCESSAMENTO" | "DENEGADA";
          xml_path?: string | null;
          protocolo_autorizacao?: string | null;
          xml_autorizado?: string | null;
          xml_cancelamento?: string | null;
          focus_nfe_ref?: string | null;
          danfe_url?: string | null;
          data_autorizacao?: string | null;
          motivo_rejeicao?: string | null;
          forma_pagamento?: string | null;
          cliente_nome?: string | null;
          cliente_documento?: string | null;
          cliente_email?: string | null;
          descricao_itens?: string | null;
          itens?: Json;
          email_enviado?: boolean | null;
          email_enviado_em?: string | null;
          modalidade_frete?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          os_id?: string;
          numero?: string;
          serie?: string;
          chave_acesso?: string | null;
          valor_total?: number;
          valor_impostos?: number | null;
          status?: "EMITIDA" | "CANCELADA" | "EM_PROCESSAMENTO" | "DENEGADA";
          xml_path?: string | null;
          protocolo_autorizacao?: string | null;
          xml_autorizado?: string | null;
          xml_cancelamento?: string | null;
          focus_nfe_ref?: string | null;
          danfe_url?: string | null;
          data_autorizacao?: string | null;
          motivo_rejeicao?: string | null;
          forma_pagamento?: string | null;
          cliente_nome?: string | null;
          cliente_documento?: string | null;
          cliente_email?: string | null;
          descricao_itens?: string | null;
          itens?: Json;
          email_enviado?: boolean | null;
          email_enviado_em?: string | null;
          modalidade_frete?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      colaboradores: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cpf: string | null;
          cargo: string;
          salario: number;
          status: "Ativo" | "Inativo" | "Afastado";
          data_admissao: string;
          data_demissao: string | null;
          data_limite_ferias: string | null;
          horas_extras_mes: number;
          telefone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cpf?: string | null;
          cargo: string;
          salario?: number;
          status?: "Ativo" | "Inativo" | "Afastado";
          data_admissao: string;
          data_demissao?: string | null;
          data_limite_ferias?: string | null;
          horas_extras_mes?: number;
          telefone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          cpf?: string | null;
          cargo?: string;
          salario?: number;
          status?: "Ativo" | "Inativo" | "Afastado";
          data_admissao?: string;
          data_demissao?: string | null;
          data_limite_ferias?: string | null;
          horas_extras_mes?: number;
          telefone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      produtos: {
        Row: {
          id: string;
          empresa_id: string;
          codigo: string;
          descricao: string;
          unidade: string;
          valor_compra: number;
          margem_lucro: number;
          valor_venda: number;
          categoria: "vidro" | "kit" | "ferragem" | "servico" | "processamento";
          ativo: boolean;
          fornecedor_id: string | null;
          ncm: string | null;
          cest: string | null;
          cfop: string | null;
          unidade_fiscal: string | null;
          origem: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          codigo: string;
          descricao: string;
          unidade?: string;
          valor_compra?: number;
          margem_lucro?: number;
          categoria?: "vidro" | "kit" | "ferragem" | "servico" | "processamento";
          ativo?: boolean;
          fornecedor_id?: string | null;
          ncm?: string | null;
          cest?: string | null;
          cfop?: string | null;
          unidade_fiscal?: string | null;
          origem?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          codigo?: string;
          descricao?: string;
          unidade?: string;
          valor_compra?: number;
          margem_lucro?: number;
          categoria?: "vidro" | "kit" | "ferragem" | "servico" | "processamento";
          ativo?: boolean;
          fornecedor_id?: string | null;
          ncm?: string | null;
          cest?: string | null;
          cfop?: string | null;
          unidade_fiscal?: string | null;
          origem?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
        ];
      };
      empresa_secrets: {
        Row: {
          id: string;
          empresa_id: string;
          chave: string;
          valor: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          chave: string;
          valor: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          chave?: string;
          valor?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "empresa_secrets_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      servicos_compostos: {
        Row: {
          id: string;
          empresa_id: string;
          codigo: string;
          nome: string;
          categoria: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          codigo: string;
          nome: string;
          categoria: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          codigo?: string;
          nome?: string;
          categoria?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "servicos_compostos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      servico_componentes: {
        Row: {
          id: string;
          servico_id: string;
          produto_id: string;
          quantidade: number;
          tipo_preco: string;
          ordem: number;
        };
        Insert: {
          id?: string;
          servico_id: string;
          produto_id: string;
          quantidade?: number;
          tipo_preco?: string;
          ordem?: number;
        };
        Update: {
          id?: string;
          servico_id?: string;
          produto_id?: string;
          quantidade?: number;
          tipo_preco?: string;
          ordem?: number;
        };
        Relationships: [
          {
            foreignKeyName: "servico_componentes_servico_id_fkey";
            columns: ["servico_id"];
            isOneToOne: false;
            referencedRelation: "servicos_compostos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "servico_componentes_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      estoque_critico: {
        Row: {
          id: string | null;
          empresa_id: string | null;
          codigo: string | null;
          descricao: string | null;
          categoria: string | null;
          quantidade: number | null;
          estoque_minimo: number | null;
          custo_unitario: number | null;
          status_critico: "Sem estoque" | "Crítico" | "Atenção" | null;
        };
      };
      os_atrasadas: {
        Row: {
          id: string | null;
          empresa_id: string | null;
          numero: string | null;
          status: string | null;
          data_previsao: string | null;
          tecnico_id: string | null;
          is_atrasada: boolean | null;
          dias_atraso: number | null;
        };
      };
    };
    Functions: {
      marcar_os_atrasadas: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
