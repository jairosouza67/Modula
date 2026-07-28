// Centralized mock data for the ModulaAPP frontend.
export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

export const navGroups = [
  {
    label: "Operacional",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { to: "/orcamentos", label: "Orçamentos", icon: "FileText" },
      { to: "/pedidos", label: "Pedidos / OS", icon: "ClipboardList" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/clientes", label: "Clientes", icon: "Users" },
      { to: "/fornecedores", label: "Fornecedores", icon: "Truck" },
      { to: "/produtos", label: "Produtos", icon: "Package" },
    ],
  },
  {
    label: "Compras",
    items: [
      { to: "/compras", label: "Compras", icon: "ShoppingCart" },
    ],
  },
  {
    label: "Logística",
    items: [
      { to: "/estoque", label: "Estoque", icon: "Boxes" },
      { to: "/instalacoes", label: "Instalações", icon: "CalendarDays" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/financeiro", label: "Financeiro", icon: "Banknote" },
      { to: "/fiscal", label: "Fiscal / NF-e", icon: "Receipt" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/rh", label: "RH / Equipe", icon: "IdCard" },
      { to: "/relatorios", label: "Relatórios / BI", icon: "BarChart3" },
      { to: "/config", label: "Configurações", icon: "Settings" },
    ],
  },
] as const;

export const faturamentoMensal = [
  { mes: "Jan", "2026": 52, "2025": 41 },
  { mes: "Fev", "2026": 61, "2025": 49 },
  { mes: "Mar", "2026": 58, "2025": 55 },
  { mes: "Abr", "2026": 70, "2025": 60 },
  { mes: "Mai", "2026": 78, "2025": 64 },
  { mes: "Jun", "2026": 0, "2025": 67 },
];

export const tipoVidro = [
  { name: "Incolor 8mm", value: 32 },
  { name: "Verde/Fumê 8mm", value: 26 },
  { name: "Espelho", value: 18 },
  { name: "Box", value: 14 },
  { name: "Outros", value: 10 },
];

export const fluxoCaixa = [
  { mes: "Dez", entrada: 62, saida: 48 },
  { mes: "Jan", entrada: 58, saida: 52 },
  { mes: "Fev", entrada: 67, saida: 51 },
  { mes: "Mar", entrada: 64, saida: 55 },
  { mes: "Abr", entrada: 75, saida: 58 },
  { mes: "Mai", entrada: 82, saida: 61 },
];

export const segmentos = [
  { mes: "Jan", construtoras: 28, residencial: 14, comercial: 10 },
  { mes: "Fev", construtoras: 32, residencial: 18, comercial: 11 },
  { mes: "Mar", construtoras: 30, residencial: 16, comercial: 12 },
  { mes: "Abr", construtoras: 38, residencial: 20, comercial: 12 },
  { mes: "Mai", construtoras: 42, residencial: 22, comercial: 14 },
];

export const ultimasOS = [
  { os: "#0348", cliente: "Construtora Nova Era", status: "Produção", variant: "info" as StatusVariant, valor: "R$ 3.420" },
  { os: "#0347", cliente: "Arq. Amanda Silva", status: "Instalado", variant: "success" as StatusVariant, valor: "R$ 1.890" },
  { os: "#0346", cliente: "Res. Park Towers", status: "Aguardando", variant: "warning" as StatusVariant, valor: "R$ 8.700" },
  { os: "#0345", cliente: "Dr. Carlos Souza", status: "Concluído", variant: "success" as StatusVariant, valor: "R$ 2.150" },
  { os: "#0342", cliente: "Hotel Bela Vista", status: "Atrasado", variant: "danger" as StatusVariant, valor: "R$ 5.600" },
];

export const orcamentos = [
  { num: "#ORC-0189", cliente: "Construtora Alpha", desc: "Fachada temperado 10mm", m2: "28,4", valor: "R$ 14.200", val: "15/05", status: "Aguardando", variant: "warning" as StatusVariant },
  { num: "#ORC-0188", cliente: "Res. Green Park", desc: "Box banheiro + esquadria", m2: "6,2", valor: "R$ 3.100", val: "12/05", status: "Aprovado", variant: "success" as StatusVariant },
  { num: "#ORC-0187", cliente: "Arq. Marina Costa", desc: "Guarda-corpo laminado 8+8", m2: "12,0", valor: "R$ 9.600", val: "10/05", status: "Aprovado", variant: "success" as StatusVariant },
  { num: "#ORC-0186", cliente: "Clínica Saúde+", desc: "Divisória drywall + vidro", m2: "18,5", valor: "R$ 7.400", val: "08/05", status: "Em revisão", variant: "info" as StatusVariant },
  { num: "#ORC-0185", cliente: "João Pereira", desc: "Espelhos lapidados", m2: "3,6", valor: "R$ 1.440", val: "05/05", status: "Expirado", variant: "danger" as StatusVariant },
];


export const ordensServico = [
  { os: "#0348", cliente: "Construtora Nova Era", tipo: "Fachada", vidro: "VI10", m2: "28,4", tecnico: "Lucas M.", prazo: "10/05", status: "Produção", variant: "info" as StatusVariant, atrasada: false },
  { os: "#0347", cliente: "Arq. Amanda Silva", tipo: "Janelas", vidro: "JV8", m2: "8,2", tecnico: "Roberto S.", prazo: "08/05", status: "Instalado", variant: "success" as StatusVariant, atrasada: false },
  { os: "#0346", cliente: "Res. Park Towers", tipo: "Guarda-corpo", vidro: "VV8", m2: "18,0", tecnico: "Carlos F.", prazo: "12/05", status: "Ag. material", variant: "warning" as StatusVariant, atrasada: false },
  { os: "#0345", cliente: "Dr. Carlos Souza", tipo: "Espelho decorativo", vidro: "EB4", m2: "3,6", tecnico: "Lucas M.", prazo: "07/05", status: "Concluído", variant: "success" as StatusVariant, atrasada: false },
  { os: "#0344", cliente: "Hotel Bela Vista", tipo: "Divisória", vidro: "VI8", m2: "22,4", tecnico: "André P.", prazo: "11/05", status: "Produção", variant: "info" as StatusVariant, atrasada: false },
  { os: "#0342", cliente: "Clínica São Lucas", tipo: "Box Banheiro", vidro: "BV", m2: "5,8", tecnico: "—", prazo: "06/05", status: "Atrasado", variant: "danger" as StatusVariant, atrasada: true },
  { os: "#0339", cliente: "Shopping Center", tipo: "Porta pivotante", vidro: "PPV8", m2: "9,0", tecnico: "Roberto S.", prazo: "05/05", status: "Atrasado", variant: "danger" as StatusVariant, atrasada: true },
];

export const filaProcessamento = [
  { ordem: 1, peca: "Temp. 10mm — 1200×2100", os: "#0348", tipo: "Corte reto", responsavel: "Lucas M.", status: "Concluído", variant: "success" as StatusVariant },
  { ordem: 2, peca: "Lam. 8+8 — 800×1900", os: "#0346", tipo: "Furação ø12", responsavel: "André P.", status: "Em corte", variant: "info" as StatusVariant },
  { ordem: 3, peca: "Temp. 8mm — 600×2000", os: "#0344", tipo: "Lapidação", responsavel: "Roberto S.", status: "Aguardando", variant: "warning" as StatusVariant },
  { ordem: 4, peca: "Espelho 4 — 400×1800", os: "#0345", tipo: "Bisotê", responsavel: "Lucas M.", status: "Na fila", variant: "neutral" as StatusVariant },
];

export const tiposProcessamento = [
  { titulo: "Corte", desc: "Reto, diagonal, formato" },
  { titulo: "Lapidação", desc: "Borda reta, bisoôtê, ogiva" },
  { titulo: "Furação", desc: "ø 6–90 mm" },
  { titulo: "Temperagem", desc: "Forno 700°C, 6–19 mm" },
  { titulo: "Laminação", desc: "PVB, SGP, EVA" },
  { titulo: "Jateamento", desc: "Fosco, decorativo, total" },
  { titulo: "Pintura/Lacca", desc: "Silk, espelhamento" },
  { titulo: "Insulação", desc: "Câmara dupla/tripla" },
];

export const clientes = [
  { nome: "Construtora Nova Era", cnpj: "12.345.678/0001-90", contato: "(11) 4002-8922", segmento: "Construtoras", ultima: "2 dias", volume: "R$ 84.200" },
  { nome: "Arq. Amanda Silva", cnpj: "987.654.321-00", contato: "(11) 99876-5432", segmento: "Arquitetos", ultima: "5 dias", volume: "R$ 18.940" },
  { nome: "Res. Park Towers", cnpj: "23.456.789/0001-12", contato: "(11) 3344-5566", segmento: "Residencial", ultima: "Hoje", volume: "R$ 32.180" },
  { nome: "Hotel Bela Vista", cnpj: "34.567.890/0001-23", contato: "(11) 2222-3333", segmento: "Comercial", ultima: "12 dias", volume: "R$ 56.700" },
  { nome: "Dr. Carlos Souza", cnpj: "111.222.333-44", contato: "(11) 98765-4321", segmento: "Residencial", ultima: "8 dias", volume: "R$ 6.430" },
];

export const fornecedores = [
  { nome: "Vidro Nobre", cnpj: "45.678.901/0001-34", categoria: "Chapas temperadas", aPagar: "R$ 4.200", venc: "Amanhã", variant: "warning" as StatusVariant },
  { nome: "Alumínio Sul", cnpj: "56.789.012/0001-45", categoria: "Perfis alumínio", aPagar: "R$ 8.900", venc: "12/05", variant: "neutral" as StatusVariant },
  { nome: "Ferragens Premium", cnpj: "67.890.123/0001-56", categoria: "Ferragens box/janela", aPagar: "R$ 2.150", venc: "20/05", variant: "neutral" as StatusVariant },
  { nome: "Espelhos Brasil", cnpj: "78.901.234/0001-67", categoria: "Espelhos lapidados", aPagar: "R$ 1.480", venc: "25/05", variant: "neutral" as StatusVariant },
];

export const estoqueItens = [
  { codigo: "VI10", desc: "Vidro Incolor 10mm", categoria: "Chapas", qtd: 3, min: 5, custo: "R$ 322", status: "Crítico", variant: "danger" as StatusVariant },
  { codigo: "VI8", desc: "Vidro Incolor 8mm", categoria: "Chapas", qtd: 12, min: 8, custo: "R$ 247", status: "OK", variant: "success" as StatusVariant },
  { codigo: "VV8", desc: "Vidro Verde / Fumê 8mm", categoria: "Chapas", qtd: 8, min: 6, custo: "R$ 315", status: "OK", variant: "success" as StatusVariant },
  { codigo: "EB4", desc: "Espelho Bisotado 4MM", categoria: "Espelhos", qtd: 2, min: 4, custo: "R$ 411", status: "Atenção", variant: "warning" as StatusVariant },
  { codigo: "EC4", desc: "Espelho Comum 4MM", categoria: "Espelhos", qtd: 6, min: 5, custo: "R$ 264", status: "OK", variant: "success" as StatusVariant },
  { codigo: "KAB", desc: "Kit Acessório Box", categoria: "Kits", qtd: 20, min: 8, custo: "R$ 21", status: "OK", variant: "success" as StatusVariant },
  { codigo: "KA", desc: "Kit Alumínio", categoria: "Perfis", qtd: 15, min: 10, custo: "R$ 58", status: "OK", variant: "success" as StatusVariant },
  { codigo: "FX", desc: "Fixador Porta Pivotante", categoria: "Ferragens", qtd: 4, min: 6, custo: "R$ 27", status: "Atenção", variant: "warning" as StatusVariant },
];

export const instaladores = [
  { nome: "Lucas M.", status: "Em campo", variant: "info" as StatusVariant, instalacoes: 14, pendentes: 2 },
  { nome: "Roberto S.", status: "Livre", variant: "success" as StatusVariant, instalacoes: 12, pendentes: 0 },
  { nome: "Carlos F.", status: "Retornando", variant: "warning" as StatusVariant, instalacoes: 9, pendentes: 1 },
  { nome: "André P.", status: "Em campo", variant: "info" as StatusVariant, instalacoes: 11, pendentes: 3 },
];

export const agendaSemana = [
  { dia: "Seg 12", itens: [{ os: "#0346", cliente: "Park Towers", inst: "Lucas" }] },
  { dia: "Ter 13", itens: [{ os: "#0348", cliente: "Nova Era", inst: "Carlos" }, { os: "#0349", cliente: "Alpha", inst: "Roberto" }] },
  { dia: "Qua 14", itens: [{ os: "#0350", cliente: "Saúde+", inst: "André" }] },
  { dia: "Qui 15", itens: [] },
  { dia: "Sex 16", itens: [{ os: "#0351", cliente: "Bela Vista", inst: "Lucas" }] },
  { dia: "Sáb 17", itens: [] },
];

export const contasReceber = [
  { titulo: "OS #0347", cliente: "Arq. Amanda Silva", venc: "10/05", valor: "R$ 1.890", status: "A vencer", variant: "info" as StatusVariant },
  { titulo: "OS #0345", cliente: "Dr. Carlos Souza", venc: "08/05", valor: "R$ 2.150", status: "A vencer", variant: "info" as StatusVariant },
  { titulo: "OS #0340", cliente: "Hotel Bela Vista", venc: "30/04", valor: "R$ 5.600", status: "Vencido", variant: "danger" as StatusVariant },
  { titulo: "OS #0338", cliente: "Construtora Alpha", venc: "02/05", valor: "R$ 4.200", status: "Vencido", variant: "danger" as StatusVariant },
];

export const contasPagar = [
  { titulo: "Fornec. Vidro Nobre", venc: "11/05", valor: "R$ 4.200", status: "A vencer", variant: "warning" as StatusVariant },
  { titulo: "Fornec. Alumínio Sul", venc: "12/05", valor: "R$ 8.900", status: "A vencer", variant: "info" as StatusVariant },
  { titulo: "Energia elétrica", venc: "15/05", valor: "R$ 1.380", status: "A vencer", variant: "info" as StatusVariant },
  { titulo: "Aluguel galpão", venc: "10/05", valor: "R$ 6.500", status: "A vencer", variant: "warning" as StatusVariant },
];

export const dre = [
  { linha: "Receita bruta", valor: "R$ 78.420", positivo: true },
  { linha: "(–) Impostos", valor: "R$ 5.490" },
  { linha: "(–) Deduções", valor: "R$ 1.180" },
  { linha: "Receita líquida", valor: "R$ 71.750", destaque: true },
  { linha: "(–) CMV", valor: "R$ 38.420" },
  { linha: "Lucro bruto", valor: "R$ 33.330", destaque: true },
  { linha: "(–) Despesas operacionais", valor: "R$ 18.640" },
  { linha: "EBITDA", valor: "R$ 14.690", destaque: true, positivo: true },
];

export const nfeList = [
  { num: "000.001.234", tomador: "Construtora Nova Era", data: "08/05", valor: "R$ 3.420", status: "Autorizada", variant: "success" as StatusVariant },
  { num: "000.001.233", tomador: "Arq. Amanda Silva", data: "07/05", valor: "R$ 1.890", status: "Autorizada", variant: "success" as StatusVariant },
  { num: "000.001.232", tomador: "Dr. Carlos Souza", data: "06/05", valor: "R$ 2.150", status: "Autorizada", variant: "success" as StatusVariant },
  { num: "000.001.231", tomador: "Res. Green Park", data: "05/05", valor: "R$ 3.100", status: "Cancelada", variant: "danger" as StatusVariant },
];

export const obrigacoes = [
  { nome: "DAS — Simples Nacional", venc: "20/05", status: "Pendente", variant: "warning" as StatusVariant },
  { nome: "SPED Fiscal EFD", venc: "25/05", status: "Pendente", variant: "info" as StatusVariant },
  { nome: "DEFIS", venc: "30/06", status: "Em prazo", variant: "neutral" as StatusVariant },
  { nome: "FGTS / eSocial", venc: "07/06", status: "Pendente", variant: "info" as StatusVariant },
];

export const colaboradores = [
  { nome: "Lucas Martins", cargo: "Instalador Sênior", admissao: "12/03/2021", salario: "R$ 3.800", he: 12, ferias: "60 dias" },
  { nome: "Roberto Silva", cargo: "Instalador", admissao: "05/07/2022", salario: "R$ 3.200", he: 8, ferias: "120 dias" },
  { nome: "Carlos Ferreira", cargo: "Instalador", admissao: "20/10/2023", salario: "R$ 3.000", he: 5, ferias: "200 dias" },
  { nome: "André Pereira", cargo: "Cortador", admissao: "01/02/2020", salario: "R$ 3.500", he: 18, ferias: "45 dias" },
  { nome: "Marina Costa", cargo: "Vendedora", admissao: "15/06/2022", salario: "R$ 2.800", he: 4, ferias: "180 dias" },
  { nome: "Marcos Gestor", cargo: "Administrador", admissao: "01/01/2019", salario: "R$ 8.500", he: 0, ferias: "300 dias" },
];

export const relatoriosBI = [
  { nome: "OS por período", desc: "Volume e prazo de entrega" },
  { nome: "Faturamento por cliente", desc: "Top clientes por receita" },
  { nome: "Produtos mais vendidos", desc: "Ranking por m² e valor" },
  { nome: "Inadimplência", desc: "Contas vencidas e devedores" },
  { nome: "Vendas por período", desc: "Análise de receita por intervalo" },
  { nome: "Ranking de clientes", desc: "Top 20 clientes por volume" },
  { nome: "Desempenho de produção", desc: "Aproveitamento e prazos" },
  { nome: "Giro e reposição de estoque", desc: "CMV e ponto de pedido" },
  { nome: "Rentabilidade por OS", desc: "Margem por ordem de serviço" },
  { nome: "Comissões e metas", desc: "Performance comercial" },
  { nome: "Compras por fornecedor (RPT-04)", desc: "Consumo e ticket médio de compras" },
];

// ===== Compras (v2.0) =====
export const comprasEtapas = [
  "Solicitado",
  "Em aprovação",
  "Aprovado",
  "Enviado ao fornecedor",
  "Confirmado",
  "Em transporte",
  "Recebido",
  "Conferido",
] as const;

export const pedidosCompra = [
  { num: "#PC-0421", fornecedor: "Vidro Nobre", solicitante: "Ana M.", valor: "R$ 12.480", criado: "08/05", etapa: 5, status: "Em transporte", variant: "info" as StatusVariant },
  { num: "#PC-0420", fornecedor: "Alumínio Sul", solicitante: "Ana M.", valor: "R$ 8.900", criado: "07/05", etapa: 7, status: "Conferido", variant: "success" as StatusVariant },
  { num: "#PC-0419", fornecedor: "Ferragens Premium", solicitante: "João V.", valor: "R$ 2.150", criado: "07/05", etapa: 1, status: "Em aprovação > 48h", variant: "danger" as StatusVariant },
  { num: "#PC-0418", fornecedor: "Espelhos Brasil", solicitante: "Ana M.", valor: "R$ 1.480", criado: "06/05", etapa: 3, status: "Enviado", variant: "info" as StatusVariant },
  { num: "#PC-0417", fornecedor: "Vidro Nobre", solicitante: "Marcos G.", valor: "R$ 18.200", criado: "05/05", etapa: 6, status: "Recebido", variant: "warning" as StatusVariant },
  { num: "#PC-0416", fornecedor: "PVB Brasil", solicitante: "Ana M.", valor: "R$ 4.620", criado: "04/05", etapa: 0, status: "Solicitado", variant: "neutral" as StatusVariant },
];

export const romaneios = [
  { num: "ROM-0118", pedido: "#PC-0420", fornecedor: "Alumínio Sul", chegada: "08/05 14:20", volumes: 12, divergencia: "Nenhuma", variant: "success" as StatusVariant },
  { num: "ROM-0117", pedido: "#PC-0417", fornecedor: "Vidro Nobre", chegada: "07/05 09:40", volumes: 8, divergencia: "1 chapa trincada", variant: "warning" as StatusVariant },
  { num: "ROM-0116", pedido: "#PC-0414", fornecedor: "Ferragens Premium", chegada: "05/05 16:10", volumes: 4, divergencia: "Nenhuma", variant: "success" as StatusVariant },
];

export const nfeEntrada = [
  { chave: "3526...0142", fornecedor: "Vidro Nobre", emissao: "08/05", valor: "R$ 12.480", xml: "Baixado", variant: "success" as StatusVariant },
  { chave: "3526...0138", fornecedor: "Alumínio Sul", emissao: "07/05", valor: "R$ 8.900", xml: "Baixado", variant: "success" as StatusVariant },
  { chave: "3526...0131", fornecedor: "Ferragens Premium", emissao: "05/05", valor: "R$ 2.150", xml: "Pendente", variant: "warning" as StatusVariant },
];

export const creditosFornecedor = [
  { fornecedor: "Vidro Nobre", origem: "Devolução chapa trincada", valor: "R$ 1.890", emissao: "02/05", saldo: "R$ 1.890" },
  { fornecedor: "Alumínio Sul", origem: "Bonificação volume", valor: "R$ 640", emissao: "28/04", saldo: "R$ 640" },
  { fornecedor: "Ferragens Premium", origem: "Devolução kit incompleto", valor: "R$ 320", emissao: "25/04", saldo: "R$ 0" },
];

// ===== Condições e Formas de Pagamento (v2.0) =====
export const formasPagamento = [
  { codigo: "PIX", nome: "PIX", taxa: "0%", prazo: "Imediato", ativo: true },
  { codigo: "DIN", nome: "Dinheiro", taxa: "0%", prazo: "Imediato", ativo: true },
  { codigo: "BOL", nome: "Boleto bancário", taxa: "R$ 3,50", prazo: "1–3 dias úteis", ativo: true },
  { codigo: "CCR", nome: "Cartão de crédito", taxa: "3,2%", prazo: "30 dias", ativo: true },
  { codigo: "CDB", nome: "Cartão de débito", taxa: "1,8%", prazo: "1 dia útil", ativo: true },
  { codigo: "TRA", nome: "Transferência (TED)", taxa: "0%", prazo: "Mesmo dia", ativo: true },
];

export const condicoesPagamento = [
  { codigo: "AVS", descricao: "À vista", parcelas: 1, intervalo: "—", entrada: "100%", desconto: "5%", ativa: true },
  { codigo: "30D", descricao: "30 dias", parcelas: 1, intervalo: "30 dias", entrada: "0%", desconto: "0%", ativa: true },
  { codigo: "30/60", descricao: "30/60 dias", parcelas: 2, intervalo: "30 dias", entrada: "0%", desconto: "0%", ativa: true },
  { codigo: "EN+2X", descricao: "Entrada + 2x", parcelas: 3, intervalo: "30 dias", entrada: "33%", desconto: "0%", ativa: true },
  { codigo: "EN+5X", descricao: "Entrada + 5x", parcelas: 6, intervalo: "30 dias", entrada: "20%", desconto: "0%", ativa: true },
  { codigo: "10X", descricao: "10x sem juros (cartão)", parcelas: 10, intervalo: "30 dias", entrada: "0%", desconto: "0%", ativa: false },
];
