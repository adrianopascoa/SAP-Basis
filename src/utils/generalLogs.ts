import { CustomGeneralLogTemplate, GeneralLogId, GeneralLogValues } from '../types/sapLogs';

export type GreetingShift = 'Bom dia' | 'Boa tarde' | 'Boa noite';

export interface GeneralLogFieldMeta {
  key: keyof GeneralLogValues;
  label: string;
  placeholder: string;
  isDate?: boolean;
  isTextarea?: boolean;
  isMono?: boolean;
}

export interface GeneralLogTemplateMeta {
  id: GeneralLogId;
  title: string;
  description: string;
  hasGreeting: boolean;
  fields: GeneralLogFieldMeta[];
}

export function getDefaultPassword(now: Date = new Date()): string {
  return `Acesso@Hypera${now.getFullYear()}`;
}

export function getDatePlusDays(days: number, now: Date = new Date()): string {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const dd = String(target.getDate()).padStart(2, '0');
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const yyyy = target.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export const DEFAULT_GENERAL_LOG_VALUES: GeneralLogValues = {
  solicitante: '',
  donoPerfil: '',
  donosRisco: '',
  perfil: '',
  data: '',
  usuario: '',
  senha: getDefaultPassword(),
  solicitacao: '',
  colaborador: '',
  novoPerfil: '',
  perfilAprovador: '',
  perfis: '',
  donoAnterior: '',
  aprovador1: '',
  aprovador2: '',
  dataLimiteAprovacao: getDatePlusDays(8),
};

export const EXAMPLE_GENERAL_LOG_VALUES: GeneralLogValues = {
  solicitante: 'Maria Exemplo',
  donoPerfil: 'DONO.EXEMPLO',
  donosRisco: 'RISCO1.EXEMPLO / RISCO2.EXEMPLO',
  perfil: 'Z:EXEMPLO_PERFIL_01',
  data: '25.11.2026',
  usuario: 'USREXEMPLO01',
  senha: getDefaultPassword(),
  solicitacao: 'RITM0000123',
  colaborador: 'João da Silva Exemplo',
  novoPerfil: 'Z:EXEMPLO_NOVO_01',
  perfilAprovador: 'Z:EXEMPLO_APROVADOR_01',
  perfis: 'Z:EXEMPLO_PERFIL_01, Z:EXEMPLO_PERFIL_02',
  donoAnterior: 'EXEMPLO.ANTERIOR',
  aprovador1: 'APROVADOR1.EXEMPLO',
  aprovador2: 'APROVADOR2.EXEMPLO, APROVADOR3.EXEMPLO',
  dataLimiteAprovacao: getDatePlusDays(8),
};

export function getTimeOfDayGreeting(now: Date = new Date()): GreetingShift {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  }
  if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  }
  return 'Boa noite';
}

export const GENERAL_LOG_TEMPLATES: GeneralLogTemplateMeta[] = [
  {
    id: 'envio-brm-grc',
    title: '1) Log de envio de BRM no GRC',
    description: 'Notifica envio de alterações configuradas para aprovação via GRC AC.',
    hasGreeting: true,
    fields: [
      { key: 'donoPerfil', label: 'Dono(a) do perfil', placeholder: 'Ex.: DONO.EXEMPLO', isMono: true },
      { key: 'donosRisco', label: 'Donos do risco', placeholder: 'Ex.: RISCO1.EXEMPLO / RISCO2.EXEMPLO', isTextarea: true },
      { key: 'perfil', label: 'Perfil', placeholder: 'Ex.: Z:EXEMPLO_PERFIL_01', isMono: true },
    ],
  },
  {
    id: 'perfil-transportado-prod',
    title: '2) Log de perfil transportado para produção',
    description: '1º de 3 contatos solicitando testes em produção e /NSU53 HTML em caso de erro.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Prezado(a)', placeholder: 'Nome do solicitante' },
    ],
  },
  {
    id: 'falta-aprovacao',
    title: '3) Log de falta de aprovação',
    description: 'Encerramento por falta de aprovação do gestor/dono do perfil até determinada data.',
    hasGreeting: true,
    fields: [
      { key: 'data', label: 'Data limite', placeholder: '25.11.2026', isDate: true, isMono: true },
    ],
  },
  {
    id: 'para-senha',
    title: '4) Log para senha',
    description: 'Envio de senha temporária inicial com validade de três dias.',
    hasGreeting: true,
    fields: [
      { key: 'usuario', label: 'Usuário', placeholder: 'Ex.: USREXEMPLO01', isMono: true },
      { key: 'senha', label: 'Senha', placeholder: getDefaultPassword(), isMono: true },
    ],
  },
  {
    id: 'encerramento-falta-retorno',
    title: '5) Log de encerramento por falta de retorno',
    description: 'Encerramento após 3 cobranças diárias sem retorno ou autorização.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Usuário / Solicitante (@)', placeholder: 'Ex.: usuario.exemplo' },
    ],
  },
  {
    id: 'falso-positivo',
    title: '6) Log de falso positivo',
    description: 'Orienta teste com movimento anterior a 05.2021 ou autorização para ECP.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Prezado(a)', placeholder: 'Nome do solicitante' },
    ],
  },
  {
    id: 'falso-positivo-funcional',
    title: '7) Log de falso positivo + envio para o funcional',
    description: 'Encerra chamado indicando abertura de chamado para análise do time funcional.',
    hasGreeting: true,
    fields: [],
  },
  {
    id: 'tecnico-perfil-aprovador',
    title: '8) Log técnico - perfil de aprovador',
    description: 'Registro técnico para validação de novo perfil e perfil de aprovador.',
    hasGreeting: false,
    fields: [
      { key: 'solicitacao', label: 'Solicitação', placeholder: 'Ex.: RITM0000123', isMono: true },
      { key: 'colaborador', label: 'Colaborador(a)', placeholder: 'Nome do colaborador' },
      { key: 'novoPerfil', label: 'Novo perfil', placeholder: 'Ex.: Z:EXEMPLO_NOVO_01', isMono: true },
      { key: 'perfilAprovador', label: 'Perfil de aprovador', placeholder: 'Ex.: Z:EXEMPLO_APROVADOR_01', isMono: true },
    ],
  },
  {
    id: 'criacao-perfil-aprovador',
    title: '9) Log para criação de perfil de aprovador',
    description: 'Informa que a criação do perfil de aprovador aguarda Controles Internos.',
    hasGreeting: true,
    fields: [],
  },
  {
    id: 'encerramento-remediacao',
    title: '10) Log para encerramento de remediação',
    description: 'Confirma conclusão das remediações solicitadas listando os perfis.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Prezado(a)', placeholder: 'Nome do solicitante' },
      { key: 'perfis', label: 'Perfis', placeholder: 'Liste os perfis remediados', isTextarea: true, isMono: true },
    ],
  },
  {
    id: 'solicitacao-su53',
    title: '11) Log para solicitação de SU53',
    description: 'Instruções passo a passo para captura e envio da tela /NSU53 em HTML.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Solicitante', placeholder: 'Nome do solicitante' },
    ],
  },
  {
    id: 'solicitacao-questionario',
    title: '12) Log para solicitação de questionário',
    description: 'Solicita preenchimento do questionário de levantamento de processo (itens a–e).',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Solicitante', placeholder: 'Nome do solicitante' },
    ],
  },
  {
    id: 'troca-dono-perfil',
    title: '13) Log para troca de dono de perfil',
    description: 'Orienta abertura de chamado para substituição de dono de perfil desligado.',
    hasGreeting: true,
    fields: [
      { key: 'solicitante', label: 'Solicitante', placeholder: 'Nome do solicitante' },
      { key: 'perfil', label: 'Perfil', placeholder: 'Ex.: Z:EXEMPLO_PERFIL_01', isMono: true },
      { key: 'donoAnterior', label: 'Dono desligado', placeholder: 'Ex.: EXEMPLO.ANTERIOR', isMono: true },
    ],
  },
  {
    id: 'aprovadores-arm',
    title: '14) Log dos aprovadores - ARM',
    description: 'Informa pendência de 1º e 2º aprovadores e prazo automático de +8 dias corridos.',
    hasGreeting: true,
    fields: [
      { key: 'aprovador1', label: '1º Aprovador', placeholder: 'Ex.: NOME' },
      { key: 'aprovador2', label: '2º Aprovador', placeholder: 'Ex.: NOME1, NOME2, NOME3' },
      {
        key: 'dataLimiteAprovacao',
        label: 'Data limite (+8 dias)',
        placeholder: getDatePlusDays(8),
        isDate: true,
        isMono: true,
      },
    ],
  },
  {
    id: 'encerramento-arm',
    title: '15) Log de encerramento de ARM',
    description:
      'Confirma criação de acesso com login automático e orientação de aguardo para acesso ao Coupa.',
    hasGreeting: true,
    fields: [],
  },
];

function valOrPlaceholder(value: string, fallback = 'XXXX'): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function generateGeneralLog(
  templateId: GeneralLogId,
  values: GeneralLogValues,
  signature: string,
  options?: { now?: Date; greetingOverride?: GreetingShift | 'auto' }
): string {
  const greeting =
    options?.greetingOverride && options.greetingOverride !== 'auto'
      ? options.greetingOverride
      : getTimeOfDayGreeting(options?.now);
  const sig = signature.trim();

  let body = '';

  switch (templateId) {
    case 'envio-brm-grc': {
      body = [
        `${greeting}!`,
        'As alterações solicitadas foram configuradas e enviadas para aprovação dos responsáveis via GRC AC, assim que for autorizado daremos continuidade no seu chamado.',
        `No momento está aguardando aprovação do(a) dono(a) do perfil: ${valOrPlaceholder(values.donoPerfil)}`,
        `Donos do risco: ${valOrPlaceholder(values.donosRisco, 'XXXXX')}`,
        `Perfil: ${valOrPlaceholder(values.perfil)}`,
      ].join('\n');
      break;
    }

    case 'perfil-transportado-prod': {
      body = [
        `${greeting}!`,
        `Prezado (a) ${valOrPlaceholder(values.solicitante)}, esse é o 1 de 3 contatos para conseguirmos atuar no seu chamado. Por gentileza, precisamos das seguintes informações para dar continuidade na sua solicitação, são essas: `,
        'Perfil transportado para produção, peço que realize os testes lá e me informe se ocorreu tudo bem.',
        'Caso ocorra falta de autorização ou erro, anexar a tela do erro e também a tela da /NSU53 no formato HTML.',
      ].join('\n');
      break;
    }

    case 'falta-aprovacao': {
      body = [
        `${greeting}!`,
        `Por falta de aprovação do gestor/dono do perfil até a data ${valOrPlaceholder(values.data)} o chamado será encerrado, conforme rege procedimentos da área de TI.`,
        'Caso realmente seja necessário o acesso, abrir um novo chamado mencionando este para que seja enviado novamente para aprovação.',
      ].join('\n');
      break;
    }

    case 'para-senha': {
      const userTrimmed = values.usuario.trim();
      const senhaTrimmed = values.senha.trim() || getDefaultPassword(options?.now);
      body = [
        `${greeting}!`,
        'Segue abaixo a senha para o acesso.',
        userTrimmed ? `Usuário: ${userTrimmed}` : 'Usuário:',
        `Senha: ${senhaTrimmed}`,
        'Obs: A senha temporária expira em três dias.',
      ].join('\n');
      break;
    }

    case 'encerramento-falta-retorno': {
      const cleanUser = valOrPlaceholder(values.solicitante.replace(/^@+/, ''), 'XXXXX');
      body = [
        `${greeting}!`,
        `Prezado (a) @${cleanUser}`,
        'Conforme ciente pelos e-mails que direcionamos, realizamos 3(três) cobranças diárias referentes a esta solicitação de serviço. No entanto, não obtivemos nenhum retorno válido ou autorização para concluirmos a solicitação.',
        'Sendo assim, conforme rege procedimentos da área de TI, a solicitação será encerrada por falta de retorno do Usuário.',
      ].join('\n');
      break;
    }

    case 'falso-positivo': {
      body = [
        `${greeting}!`,
        `Prezado(a) ${valOrPlaceholder(values.solicitante, 'xxxxxx')},`,
        'O erro apresentado já não configura falta de acesso, o que pode estar ocorrendo é falta de movimento atual e ou cadastro neste ambiente de testes, favor verificar se é possível efetuar testes com movimento anterior a 05.2021, pois este ambiente não é atualizado diariamente, se não for possível favor autorizar para levar ao ambiente produtivo (ECP) para que lá possa testar.',
      ].join('\n');
      break;
    }

    case 'falso-positivo-funcional': {
      body = [
        `${greeting}!`,
        'O erro apresentado no print da SU53 é um falso positivo, não mostrando novas liberações a serem realizadas.',
        'As liberações anteriores foram realizadas conforme prints da SU53 enviados.',
        'Neste caso terá que abrir um chamado solicitando uma análise do funcional para a liberação da atividade.',
        'Após a análise do funcional será informado por eles se será necessário atuação do time de Acessos SAP.',
        'Quanto a este chamado será encerrado.',
      ].join('\n');
      break;
    }

    case 'tecnico-perfil-aprovador': {
      body = [
        'Log técnico',
        `Solicitação: ${valOrPlaceholder(values.solicitacao)}`,
        `Conforme solicitado pelo(a) colaborador(a) ${valOrPlaceholder(values.colaborador)}, favor validar a criação de perfil.`,
        `Novo perfil: ${valOrPlaceholder(values.novoPerfil)}`,
        `Perfil de aprovador – ${valOrPlaceholder(values.perfilAprovador)}`,
      ].join('\n');
      break;
    }

    case 'criacao-perfil-aprovador': {
      body = [
        `${greeting}!`,
        'A solicitação de criação do perfil de aprovador encontra-se aguardando aprovações de Controles Internos.',
      ].join('\n');
      break;
    }

    case 'encerramento-remediacao': {
      const perfisTrimmed = values.perfis.trim();
      body = [
        `${greeting}!`,
        `Prezado ${valOrPlaceholder(values.solicitante)}, conforme sua solicitação, as remediações foram realizadas com sucesso.`,
        perfisTrimmed ? `Perfis: ${perfisTrimmed}` : 'Perfis:',
      ].join('\n');
      break;
    }

    case 'solicitacao-su53': {
      body = [
        `${greeting}`,
        `${valOrPlaceholder(values.solicitante)}, por gentileza enviar a tela da SU53 no formato HTML.`,
        'Para capturar essa tela é necessário tentar executar a atividade desejada e após o erro (Sem autorização para a transação ...), inserir (/NSU53) no campo de acesso a transação. Este comando gerará uma tela e é está a tela que deve ser printada e enviada para nós.',
        'Execute a transação/ação que apresentou erro de autorização.',
        '1. Assim que aparecer a mensagem de erro, digite /NSU53 e pressione ENTER (sem fechar a tela).',
        '2. Na tela exibida, clique em "Gravar como file" (ícone de disquete).',
        '3. Selecione o tipo HTML, salve o arquivo no computador.',
        '4. Anexe o arquivo HTML no chamado.',
      ].join('\n');
      break;
    }

    case 'solicitacao-questionario': {
      body = [
        `${greeting}!`,
        `${valOrPlaceholder(values.solicitante)}, por favor preencher o questionário abaixo para darmos continuidade.`,
        'a) Ambiente?',
        'b) Como esta atividade é executada hoje? (Por qual área? Por quem? Como?)',
        'c) Como esta atividade será executada após a concessão do acesso?',
        'd) Quais mudanças ocorreram no processo para que houvesse a necessidade da solicitação e/ou motivo que gerou a necessidade de mudança no perfil?',
        'e) Tipo de Alteração?',
      ].join('\n');
      break;
    }

    case 'troca-dono-perfil': {
      const perfilVal = valOrPlaceholder(values.perfil);
      body = [
        `${greeting}!`,
        `${valOrPlaceholder(values.solicitante)} o dono do perfil ${perfilVal} (${valOrPlaceholder(values.donoAnterior)}) encontra-se desligado da empresa.`,
        `Por favor abrir um novo chamado solicitando a troca do dono do perfil ${perfilVal} para um novo aprovador.`,
        'Após a troca solicitar novamente o seu acesso mencionando este chamado.',
      ].join('\n');
      break;
    }

    case 'aprovadores-arm': {
      const dataLimite =
        values.dataLimiteAprovacao.trim() || getDatePlusDays(8, options?.now);
      body = [
        `${greeting}!`,
        `1º Aprovador – ${valOrPlaceholder(values.aprovador1, 'NOME')} - Aguardando aprovação.`,
        `2º Aprovador – ${valOrPlaceholder(values.aprovador2, 'NOME1, NOME2, NOME3')} - Aguardando aprovação.`,
        `Se não ocorrer aprovação até a data ${dataLimite}, o chamado será cancelado automaticamente por falta de aprovação.`,
      ].join('\n');
      break;
    }

    case 'encerramento-arm': {
      body = [
        `${greeting}!`,
        '',
        'Conforme solicitado, o acesso foi criado. Seguem os detalhes:',
        '',
        'Login automático, não requer senha.',
        'Para acessar o Coupa, aguarde uma hora após o envio desta mensagem.',
      ].join('\n');
      break;
    }
  }

  return sig ? `${body}\n\n${sig}` : body;
}

export function extractCustomTemplateVariables(bodyTemplate: string): string[] {
  const vars: string[] = [];
  const seen = new Set<string>();
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(bodyTemplate)) !== null) {
    const name = match[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      vars.push(name);
    }
  }
  return vars;
}

export function generateCustomGeneralLog(
  template: CustomGeneralLogTemplate,
  variableValues: Record<string, string>,
  signature: string,
  options?: { now?: Date; greetingOverride?: GreetingShift | 'auto' }
): string {
  const greeting =
    options?.greetingOverride && options.greetingOverride !== 'auto'
      ? options.greetingOverride
      : getTimeOfDayGreeting(options?.now);

  const interpolated = template.bodyTemplate.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_full, raw) => {
    const key = String(raw).trim();
    const val = (variableValues[key] || '').trim();
    return val || 'XXXX';
  });

  const cleanBody = interpolated.trim();
  const body = template.hasGreeting
    ? cleanBody
      ? `${greeting}!\n${cleanBody}`
      : `${greeting}!`
    : cleanBody;

  const sig = signature.trim();
  if (!sig) return body;
  return body ? `${body}\n\n${sig}` : sig;
}

export interface PlaceholderDetectionResult {
  tokens: string[];
  missingFields: string[];
}

export const PLACEHOLDER_TOKEN_PATTERN = /\b(XXXXX|XXXX|xxxxxx|NOME1|NOME2|NOME3|NOME)\b/g;

export function detectUnfilledPlaceholders(
  fullText: string,
  signature: string,
  missingFieldLabels: string[] = []
): PlaceholderDetectionResult {
  const sig = signature.trim();
  let bodyToScan = fullText;
  if (sig && bodyToScan.endsWith(sig)) {
    bodyToScan = bodyToScan.slice(0, bodyToScan.length - sig.length).trimEnd();
  }

  const found = new Set<string>();
  const matches = bodyToScan.match(PLACEHOLDER_TOKEN_PATTERN);
  if (matches) {
    for (const token of matches) {
      found.add(token);
    }
  }

  return {
    tokens: Array.from(found),
    missingFields: missingFieldLabels,
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterAndSortGeneralTemplates<
  T extends { id: string; title: string; description?: string },
>(items: T[], query: string, favoriteIds: string[]): T[] {
  const favSet = new Set(favoriteIds);
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);

  const filtered =
    terms.length === 0
      ? items
      : items.filter((item) => {
          const haystack = normalizeSearchText(`${item.title} ${item.description || ''}`);
          return terms.every((term) => haystack.includes(term));
        });

  return [...filtered].sort((a, b) => {
    const aFav = favSet.has(a.id) ? 0 : 1;
    const bFav = favSet.has(b.id) ? 0 : 1;
    return aFav - bFav;
  });
}
