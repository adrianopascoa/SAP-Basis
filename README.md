# SAP Basis — Central de Logs e Atendimento

Aplicação web desenvolvida para agilizar e padronizar a rotina operacional de equipes **SAP Basis**, centralizando a geração de logs de **ARM (GRC AC)**, **BRM (Manutenção de Função)**, **comunicações gerais de atendimento**, **geração de SNC** e **links rápidos de operação**.

> Todos os dados configurados (assinatura, histórico, modelos personalizados, favoritos e links extras) são processados e armazenados **100% no navegador** (`localStorage`), sem necessidade de servidor ou banco de dados externo.

---

## Principais Funcionalidades

### Painel Inicial
- **Acesso rápido aos módulos** BRM, ARM e Logs Gerais.
- **Links Importantes**: menu suspenso com atalhos operacionais que abrem em nova aba e botão **+ Novo link** para adicionar e gerenciar links personalizados.
- **Assinatura de E-mail**: edição e restauração da assinatura padrão aplicada automaticamente aos e-mails e comunicados.
- **Atividade Recente**: visualização e cópia rápida dos últimos logs gerados.
- **Extrator SU53**: atalho direto na barra superior.

### ARM — Solicitação de Acesso (SAP GRC AC)
- Fluxos para **Criação de usuário**, **Troca de perfil**, **Delegação de aprovações**, **Prorrogação de acesso** e **Atribuição de perfil temporário**.
- Controle de validade para terceiros e acessos temporários (**Por data** com seletor de calendário ou **Em dias**).
- Campo multilinha para informar múltiplos perfis.
- **Gerador SNC (AD)**: conversão automática para o formato `p:CN=<USUARIO>@<DOMINIO>`.
- Campos para **1º Aprovador** e **2º Aprovador** integrados ao **Log Serv. Now**, com cálculo automático do prazo limite de aprovação (**+8 dias**).
- Geração de **Log Anexo**, **Log GRC** e **Log Serv. Now**.

### BRM — Manutenção de Função
- Geração de **Log Técnico** com omissão automática dos rótulos *Transações inclusas* e *Objetos* quando deixados em branco.
- Geração de **E-mail de Cobrança** com inclusão automática do **Usuário teste** e da assinatura configurada.
- Botão **Carregar Exemplo** para testes e conferência rápida.

### Logs Gerais (15 modelos padrão + Personalizados)
- **15 modelos padronizados** de atendimento (envio de BRM no GRC, cobranças de teste em produção, falta de aprovação, reset de senha, SU53, questionário, troca de dono de perfil, aprovadores ARM, encerramento de ARM, entre outros).
- Saudação automática conforme o horário (**Bom dia / Boa tarde / Boa noite**), cálculo automático de prazos e senha padrão dinâmica com atualização anual.
- Criação, edição, exclusão e fixação (favoritos) de **modelos personalizados** com variáveis dinâmicas no formato `{{NomeDoCampo}}`.
- Destaque visual no console para placeholders pendentes antes da cópia.

### Console e Histórico
- Console com numeração de linhas, edição manual rápida, cópia para a área de transferência e download em `.txt`.
- Histórico local persistido no navegador (até 40 registros) com filtro, cópia e limpeza.

---

## Stack Tecnológica

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**
- **Lucide React**
- **Vercel** (hospedagem estática SPA com headers de segurança e cache otimizado)

---

## Como Executar Localmente

### Pré-requisitos
- **Node.js 20+** (ou **Bun**)

### Instalação e Execução

```bash
# Clonar o repositório
git clone https://github.com/Adrianopascoa/SAP-Basis.git
cd SAP-Basis

# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento (http://localhost:3000)
npm run dev
```

### Outros Comandos

```bash
# Verificação de tipos TypeScript
npm run lint

# Build de produção (gera a pasta dist/)
npm run build

# Visualizar build de produção localmente
npm run preview

# Executar testes automatizados (com Bun)
bun test
```

---

## Estrutura do Projeto

```text
├── public/                 # Ativos públicos estáticos
├── src/
│   ├── components/         # Telas e componentes de UI (Painel, ARM, BRM, Logs Gerais, Histórico, Modais)
│   ├── types/              # Definições de tipos TypeScript
│   ├── utils/              # Geradores de logs, validações de armazenamento/URLs e testes unitários
│   ├── App.tsx             # Orquestração de rotas, persistência local e layout principal
│   └── main.tsx            # Ponto de entrada da aplicação
├── index.html              # Documento HTML principal
├── vercel.json             # Configurações de build estático, cache e headers de segurança
└── vite.config.ts          # Configuração do Vite e otimização de bundle/assets
```

---

## Segurança e Otimização (Vercel Hobby)

- **Zero funções serverless**: aplicação compilada integralmente como SPA estática em `dist/`.
- **Headers de segurança** configurados em `vercel.json` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- **Validação de armazenamento local e URLs**: dados lidos do `localStorage` passam por validação de esquema e links personalizados aceitam apenas protocolos `http://` ou `https://`.
- **Carregamento sob demanda**: módulos e modais secundários usam `React.lazy` com separação de chunks no build e cache imutável de ativos com hash.
