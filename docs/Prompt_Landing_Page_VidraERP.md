# Prompt — Landing Page de Vendas do VidraERP

Use este documento como prompt completo para gerar a landing page (em uma IA de design/código, ou como briefing para um desenvolvedor/agência). Ele contém contexto, direção de copy, direção visual e especificação técnica.

---

## 1. Contexto do produto

VidraERP é um sistema de gestão (ERP) criado especificamente para vidraçarias, que nasceu atendendo uma única empresa e está sendo transformado em um produto SaaS multi-tenant: qualquer vidraçaria poderá contratar e ter seu próprio ambiente isolado, com todos os módulos abaixo:

Dashboard com KPIs · Orçamentos com calculadora vidraceira automática · Pedidos/OS em pipeline kanban · Produção com plano de corte 2D (bin packing) · Clientes · Fornecedores · Produtos (com kits e composição) · Compras (fluxo de 7 etapas) · Estoque com baixa automática · Instalações (agenda de campo) · Financeiro (DRE, fluxo de caixa) · Fiscal/NF-e (emissão real via SEFAZ) · RH/Equipe · Relatórios/BI.

**Diferencial central:** não é um ERP genérico adaptado — é construído em cima da lógica real de uma vidraçaria (m², plano de corte, kits de ferragens, processamento de vidro, NF-e), então qualquer vidraceiro reconhece a linguagem do sistema no primeiro clique.

---

## 2. Público-alvo

- Donos/gestores de vidraçarias de pequeno e médio porte no Brasil
- Hoje usam planilhas soltas, papel, ou sistemas genéricos que não entendem o negócio de vidro
- Dor real: orçamento demorado e sujeito a erro de cálculo, controle de estoque de chapas manual, retrabalho no corte, dificuldade de emitir NF-e corretamente, falta de visão financeira consolidada
- Não são necessariamente pessoas "de tecnologia" — a copy precisa ser direta, sem jargão técnico, focada em resultado (tempo economizado, erro evitado, dinheiro que deixa de vazar)

---

## 3. Proposta de valor central (posicionamento)

> "O único ERP que fala a língua da vidraçaria — do orçamento por m² ao plano de corte, da compra de chapas à nota fiscal."

Ângulos de persuasão a explorar na copy:
1. **Precisão como identidade da marca** — vidraceiro trabalha com milímetro; a gestão dele devia ter a mesma precisão. (metáfora forte: "corte sem erro" aplicado à gestão)
2. **Tempo é o recurso mais escasso** — cada orçamento manual são minutos perdidos que poderiam fechar mais uma venda no mesmo dia
3. **Transparência** (trocadilho literal com vidro) — visibilidade total do negócio: financeiro, estoque, produção, tudo visível, nada "opaco"
4. **Especialização vence genérico** — outros ERPs exigem adaptação; este já nasce entendendo m², kits, ferragens, processamento

---

## 4. Tom de voz

- Direto, confiante, sem enrolação
- Frases curtas nos headlines, parágrafos curtos no corpo
- Usa a metáfora do vidro (transparência, precisão, corte, reflexo, luz) com moderação — presente mas não repetitiva a ponto de cansar
- Evita jargão técnico de software (não fala "multi-tenant", "SaaS", "API" na copy voltada ao cliente final — isso é para quem compra, não para o vidraceiro)
- CTAs sempre orientados a ação imediata e de baixo risco: "Ver demonstração", "Testar grátis", "Falar com especialista"

---

## 5. Direção visual — futurista, moderno, 3D

**Conceito central:** o vidro como elemento visual principal. Uma cena 3D com painéis de vidro flutuantes, refração de luz, glassmorphism, em ambiente dark mode — o produto literalmente "é feito de vidro".

**Paleta de cores:**
- Base: preto/azul-marinho profundo (`#050B14`, `#0B1622`)
- Vidro/destaque: azul-ciano translúcido (`#4FD6FF`, `#7FE7FF`) simulando reflexo de vidro
- Acento quente (CTA, prova de vida): âmbar/laranja (`#FF8A3D`) — contraste quente contra o frio do vidro
- Texto: branco/quase-branco (`#F2F6FA`) sobre fundo escuro; cinza-azulado (`#8FA3B8`) para textos secundários

**Tipografia:**
- Display/headlines: uma serifada moderna e forte (tipo Cambria/Playfair) OU uma sans geométrica extra-bold — escolher uma e manter consistência; recomendo sans geométrica bold para reforçar "futurista/tech"
- Corpo: sans-serif limpa (Inter, Manrope, ou similar)

**Efeitos visuais:**
- Glassmorphism em cards (fundo semi-transparente, blur, borda sutil de luz)
- Parallax leve no scroll
- Micro-interações em hover (brilho, leve elevação, reflexo)
- Nada de excesso de animação que prejudique performance/leitura — futurista, mas funcional

---

## 6. Especificação técnica do Three.js

**Cena principal (Hero):**
- Um ou mais painéis de vidro 3D flutuando em um espaço escuro, com refração/reflexo de luz realista (usar `MeshPhysicalMaterial` do Three.js com `transmission`, `roughness` baixo, `ior` ~1.5 para simular vidro real)
- Leve rotação automática + resposta sutil ao movimento do mouse (parallax 3D)
- Partículas de luz/poeira flutuando no fundo para dar profundidade
- Ao rolar a página, os painéis de vidro podem se reorganizar/dividir em fragmentos que representam os módulos do sistema (transição hero → seção de features)

**Stack técnico recomendado:**
- React + `@react-three/fiber` (wrapper React do Three.js) + `@react-three/drei` (helpers prontos: `Environment`, `MeshTransmissionMaterial`, `Float`)
- `MeshTransmissionMaterial` do drei é ideal aqui — já simula vidro realista com poucas linhas
- Animações de scroll: `framer-motion` + `react-three-fiber` com `useScroll`
- Fallback obrigatório: em dispositivos de baixo desempenho ou mobile mais fraco, detectar e servir uma versão estática/imagem otimizada no lugar da cena 3D (performance > efeito)

**Performance:**
- Lazy-load do bundle Three.js (não bloquear o first paint)
- Limitar a cena 3D a poucos objetos (3–6 painéis), nada de milhares de partículas
- Testar Lighthouse mobile — meta de LCP abaixo de 2.5s mesmo com a cena 3D

---

## 7. Estrutura da página com copy sugerida

### Hero
**Headline (escolher uma ou testar A/B):**
- "Precisão de milímetro no corte. Devia ser assim na gestão também."
- "Sua vidraçaria já é precisa. Sua gestão finalmente vai acompanhar."
- "O ERP que enxerga sua vidraçaria com a nitidez de um vidro novo."

**Subheadline:**
"Orçamento, produção, estoque, financeiro e nota fiscal — tudo em um sistema que já nasceu entendendo m², kits e plano de corte. Sem adaptar. Sem retrabalho."

**CTA primário:** "Ver demonstração" · **CTA secundário:** "Falar com especialista"

### Seção — O problema (agitação)
Headline: "Você não perde dinheiro no corte. Perde na planilha."
Lista curta de dores (cada uma como card com ícone): orçamento manual demorado, erro de cálculo de m², estoque de chapas sem controle, NF-e emitida errado, zero visão financeira consolidada.

### Seção — A solução (visão geral dos módulos)
Headline: "Um sistema. Toda a vidraçaria."
Grid com os 14 módulos, cada um com ícone + 1 frase de benefício (não lista de features técnicas, e sim resultado):
- Orçamentos → "Feche orçamentos em minutos, com preço certo sempre"
- Produção → "Aproveite cada chapa ao máximo com plano de corte automático"
- Estoque → "Nunca mais pare uma obra por falta de material"
- Financeiro → "Saiba exatamente quanto entra e quanto sai, todo mês"
- Fiscal/NF-e → "Nota fiscal emitida certo, sem dor de cabeça"

### Seção — Como funciona (3 passos)
"1. Cadastre sua vidraçaria → 2. Configure seu catálogo de serviços e preços → 3. Comece a orçar, produzir e vender com controle total"

### Seção — Prova social (placeholder até ter depoimentos reais)
Espaço para depoimentos de vidraçarias clientes, números de resultado (ex: "X% menos tempo em orçamentos", "X vidraçarias já confiam"). *Nota: usar apenas números reais quando disponíveis — não inventar estatísticas.*

### Seção — Planos
Estrutura de 2–3 planos (Essencial / Profissional / Completo), com preço, limite de usuários/OS por mês, e um CTA por plano. Se ainda não há preços definidos, usar "Fale com a gente" no lugar de valor fixo.

### FAQ
Perguntas que reduzem objeção de compra: "Preciso trocar meu jeito de trabalhar?", "Meus dados ficam seguros?", "Dá pra emitir nota fiscal de verdade?", "Quanto tempo leva pra implantar?"

### CTA final
Headline: "Sua próxima obra já pode começar com um orçamento certo em minutos."
Botão: "Começar agora" / "Agendar demonstração"

### Footer
Logo, links institucionais, contato, redes sociais, aviso de direitos autorais.

---

## 8. Requisitos técnicos gerais

- Stack: React + TypeScript + Vite (consistente com o restante do produto) + Tailwind CSS + `@react-three/fiber`/drei + framer-motion
- Totalmente responsivo (mobile-first para as seções de texto; cena 3D com fallback leve no mobile)
- SEO: meta tags, Open Graph, título e descrição otimizados para busca por "sistema para vidraçaria", "ERP vidraçaria", "software gestão vidraçaria"
- Formulário de contato/demo conectado a um endpoint real (ex: envio por e-mail via Resend, já usado no projeto)
- Acessibilidade básica: contraste mínimo AA mesmo no tema escuro, textos alternativos, navegação por teclado

---

## 9. Entregáveis esperados

1. Landing page completa em React, single-page, com as seções acima
2. Cena 3D funcional no Hero com fallback para mobile/baixo desempenho
3. Copy final revisada (a sugerida acima é ponto de partida, não texto definitivo)
4. Formulário de captura de lead funcional
5. Versão responsiva testada em mobile, tablet e desktop
