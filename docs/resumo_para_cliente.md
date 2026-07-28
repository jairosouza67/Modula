# ✉️ O Que Preciso de Você — Integração NF-e no Sistema

**Para:** Dono da ModulaAPP  
**De:** Desenvolvedor do Sistema ModulaAPP  
**Assunto:** Itens necessários para o sistema emitir NF-e automaticamente

---

Olá! Para que o seu sistema ERP emita notas fiscais de verdade (com validade legal, integrado à SEFAZ-BA), preciso de **3 itens** da sua parte. Vou explicar cada um de forma simples.

---

## Item 1 — Certificado Digital A1 (o mais importante)

**O que é?**  
É o arquivo que você usa para "assinar" as notas fiscais eletronicamente — funciona como a sua assinatura digital. Sem ele, nenhum sistema consegue emitir NF-e.

**Você provavelmente já tem**, pois já emite nota pelo site da SEFAZ-BA.

**O que preciso de você:**
- O arquivo do certificado (extensão `.pfx` ou `.p12`)
- A **senha** do certificado

**Como encontrar o arquivo:**
1. Pergunte para o seu contador — ele provavelmente tem o arquivo
2. Ou acesse o computador onde o certificado foi instalado:
   - Windows: Painel de Controle → Opções de Internet → Conteúdo → Certificados → Exportar
3. O arquivo geralmente tem um nome como `certificado_empresa.pfx`

> ⚠️ **Importante:** Esse arquivo é sigiloso — não envie por WhatsApp público. Me envie por e-mail direto ou me passe pessoalmente.

---

## Item 2 — Conta na Focus NFe (plataforma intermediária)

**O que é?**  
A Focus NFe é uma plataforma que faz a "ponte" entre o nosso sistema e a SEFAZ. Em vez de lidar com o site da SEFAZ manualmente, o sistema vai enviar as notas automaticamente por ela.

**O que preciso:**
1. Você criar uma conta gratuita em: **[focusnfe.com.br](https://focusnfe.com.br)**
   - Clique em "Teste Grátis" (30 dias sem custo)
   - Preencha com os dados da empresa
2. Após criar a conta, enviar para mim o **Token de API** (uma senha longa gerada pela plataforma)
   - Fica em: Painel da Focus NFe → Configurações → Tokens de API

**Custo após o período gratuito:** R$ 89,90/mês (Plano Solo — 1 CNPJ + 100 notas/mês)

---

## Item 3 — NCM dos Produtos (código fiscal dos itens que você vende)

**O que é?**  
O NCM é um código numérico obrigatório em toda NF-e que identifica o tipo de produto. Cada produto que você vende tem um NCM diferente.

**O que preciso:**  
Preencher a tabela abaixo junto com seu contador:

| Produto que você vende | NCM | Confirmado pelo contador? |
|---|---|---|
| Vidro Float (comum, liso) | 7005.10.00 | ☐ |
| Vidro Temperado | 7007.19.00 | ☐ |
| Vidro Laminado | 7007.29.00 | ☐ |
| Espelho | 7009.91.00 | ☐ |
| Box de Banheiro | 7020.00.00 | ☐ |
| Mármore / Granito (pedras) | 6802.91.00 | ☐ |
| Serviço de Instalação | 8302.42.00 | ☐ |

> ⚠️ **Peça ao seu contador** para confirmar esses códigos. Código errado causa rejeição da nota pela SEFAZ.

---

## Checklist Resumido

- [ ] **Arquivo do certificado digital** (`.pfx` ou `.p12`) + senha
- [ ] **Token da Focus NFe** (criar conta + copiar o token)
- [ ] **NCM dos produtos** confirmados pelo contador

---

## Dados da Empresa que já tenho (não precisa me enviar)

✅ CNPJ: 14.032.864/0001-08  
✅ Inscrição Estadual: 096.918.958 ME  
✅ Endereço completo  
✅ Regime: Simples Nacional  

---

## Dúvidas?

Qualquer dúvida, pode me chamar. Assim que tiver os 3 itens acima, a integração pode ser feita em aproximadamente **1 semana**.
