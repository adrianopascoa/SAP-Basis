import {
  ArmFormState,
  ArmLegadosState,
  ArmMultiploState,
  BrmFormState,
  EncerramentoStandaloneState,
} from '../types/sapLogs';

export const DEFAULT_SIGNATURE = `Você receberá uma Pesquisa de Satisfação em seu e-mail quando este chamado for encerrado. Sua avaliação é fundamental para que possamos aprimorar nosso atendimento.
NOME| Application Management Services SAP Basis

Atenciosamente,`;

export const SAP_ENVIRONMENTS = [
  '07) SAP ERP Qualidade',
  '08) SAP BW Qualidade',
  '09) SAP GRC AC Qualidade',
  '10) ------ Ambientes de Desenvolvimento -----',
  '11) SAP ERP Desenvolvimento',
  '12) SAP BW Desenvolvimento',
  '13) SAP GRC AC Desenvolvimento',
  '14) SAP Solman Desenvolvimento',
];

export const BRM_QUALITY_ENVIRONMENTS = [
  '07) SAP ERP Qualidade',
  '08) SAP BW Qualidade',
  '09) SAP GRC AC Qualidade',
];

export const DEFAULT_ARM_STATE: ArmFormState = {
  requestType: 'Criação de usuário',
  terceiro: false,
  porData: false,
  emDias: false,
  dataDe: '',
  dataAte: '',
  dias: '',
  abertoPor: '',
  cargoSolicitante: '',
  deptSolicitante: '',
  chamado: '',
  grcRequestNumber: '',
  usuarioCopiaSap: '',
  usuarioSap: '',
  nomeCompleto: '',
  cargo: '',
  departamento: '',
  perfil: '',
  dePerfil: '',
  paraPerfil: '',
  prorrogarPerfil: '',
  usuarioAtualAprovador: '',
  usuarioNovoAprovador: '',
  nomeAtualAprovadorCargo: '',
  nomeNovoAprovadorCargo: '',
  delegarPerfil: '',
  ambiente: 'ECP/EQ1/ED1/ACP/ACQ/ACD',
  usuarioAd: '',
  adDomain: 'PRATIKA.BR',
  textoEmailEncerramento: '',
  reprovado: false,
  expirado: false,
  portal: false,
};

export const ARM_EXAMPLE_STATE: ArmFormState = {
  ...DEFAULT_ARM_STATE,
  requestType: 'Criação de usuário',
  abertoPor: 'Mariana Oliveira Costa',
  cargoSolicitante: 'Coordenadora Financeira',
  deptSolicitante: 'Controladoria',
  chamado: 'RITM0482910',
  grcRequestNumber: '1234',
  usuarioCopiaSap: 'JSILVA04',
  usuarioSap: 'RFERREIRA12',
  nomeCompleto: 'Rafael Ferreira Santos',
  cargo: 'Analista Contábil Pleno',
  departamento: 'Contabilidade Fiscal',
  perfil: 'ZF:FI_GL_PL_ANL_001',
  ambiente: 'ECP/EQ1/ED1/ACP/ACQ/ACD',
  usuarioAd: 'ADRIANO.PASCOA@PRATIKA.BR',
  adDomain: 'PRATIKA.BR',
};

export const DEFAULT_BRM_STATE: BrmFormState = {
  nomeSolicitante: '',
  numeroChamado: '',
  usuarioSap: '',
  tipo: 'Modificar função derivada',
  transacoesUtilizadas: '',
  transacoes: '',
  alteracaoSomenteNivelOrg: false,
  objetoNivelOrg: '',
  perfilMestre: '',
  perfilDerivado: '',
  ambiente: '07) SAP ERP Qualidade',
  detalhesServiceNow: '',
};

export const BRM_EXAMPLE_STATE: BrmFormState = {
  nomeSolicitante: 'Thiago Andrade Da Silva',
  numeroChamado: 'TASK1520305',
  usuarioSap: 'TASILVA07',
  tipo: 'Modificar função derivada',
  transacoesUtilizadas: 'QA32, QE51N',
  transacoes: 'SE16N',
  alteracaoSomenteNivelOrg: true,
  objetoNivelOrg: `Q_INSPPNT
ACTVT: 03
ARBPL: CQ.CP
QINSPPNTTY: 3
QMATAUTH: Z00005
QPRUEFART: Z0104
WERKS: 5001

S_GUI
ACTVT: 02`,
  perfilMestre: 'ZF:QM_CQ_PA_SR_ANL_001',
  perfilDerivado: 'ZF:QM_CQ_PA_SR_ANL_001_0001',
  ambiente: '07) SAP ERP Qualidade',
  detalhesServiceNow:
    'Solicitação TASK1520305 — Liberar consulta SE16N e ajustar nível organizacional centro 5001 / CQ.CP para usuário TASILVA07 na função derivada ZF:QM_CQ_PA_SR_ANL_001_0001.',
};

function clean(value: string): string {
  return value.trim();
}

function formatValidityLines(state: ArmFormState): string[] {
  const lines: string[] = [];
  if (state.porData && (clean(state.dataDe) || clean(state.dataAte))) {
    lines.push(`Período: De ${clean(state.dataDe) || '-'} até ${clean(state.dataAte) || '-'}`);
  }
  if (state.emDias && clean(state.dias)) {
    lines.push(`Período: ${clean(state.dias)} dias`);
  }
  if (state.portal) {
    lines.push('Portal: Sim');
  }
  return lines;
}

function formatArmDetailsBlock(state: ArmFormState, variant: 'anexo' | 'servnow'): string[] {
  const lines: string[] = [];

  if (state.requestType === 'Delegação de aprovações') {
    lines.push(
      `Aprovador Atual: ${clean(state.nomeAtualAprovadorCargo)} / ${clean(state.usuarioAtualAprovador)}`
    );
    lines.push(
      `Novo Aprovador: ${clean(state.nomeNovoAprovadorCargo)} / ${clean(state.usuarioNovoAprovador)}`
    );
    lines.push(`Delegar perfil: ${clean(state.delegarPerfil)}`);
  } else if (state.requestType === 'Troca de perfil') {
    lines.push(`Nome/Usuário: ${clean(state.nomeCompleto)} / ${clean(state.usuarioSap)}`);
    lines.push(
      `${variant === 'servnow' ? 'Cargo' : 'Cargo/Departamento'}: ${clean(state.cargo)}, ${clean(state.departamento)}`
    );
    lines.push(`De perfil: ${clean(state.dePerfil)}`);
    lines.push(`Para perfil: ${clean(state.paraPerfil)}`);
  } else if (state.requestType === 'Prorrogação de acesso') {
    lines.push(`Nome/Usuário: ${clean(state.nomeCompleto)} / ${clean(state.usuarioSap)}`);
    lines.push(
      `${variant === 'servnow' ? 'Cargo' : 'Cargo/Departamento'}: ${clean(state.cargo)}, ${clean(state.departamento)}`
    );
    lines.push(`Prorrogar perfil: ${clean(state.prorrogarPerfil)}`);
  } else {
    lines.push(`Nome/Usuário: ${clean(state.nomeCompleto)} / ${clean(state.usuarioSap)}`);
    lines.push(
      `${variant === 'servnow' ? 'Cargo' : 'Cargo/Departamento'}: ${clean(state.cargo)}, ${clean(state.departamento)}`
    );
    lines.push(`Perfil: ${clean(state.perfil)}`);
  }

  if (variant === 'servnow') {
    lines.push(`Tipo do colaborador: ${state.terceiro ? 'Terceiro' : 'Funcionario'}`);
    if (state.requestType !== 'Delegação de aprovações') {
      lines.push(`Usuário copia: ${clean(state.usuarioCopiaSap)}`);
    }
  } else {
    lines.push(`Tipo do colaborador: ${state.terceiro ? 'Terceiro' : 'Funcionário'}`);
    if (state.requestType !== 'Delegação de aprovações') {
      lines.push(`Usuário cópia: ${clean(state.usuarioCopiaSap)}`);
    }
  }

  lines.push(...formatValidityLines(state));
  return lines;
}

export function validateArmForm(
  state: ArmFormState,
  action: 'log' | 'anexo' | 'servnow' | 'encerramento' | 'snc'
): string[] {
  const missing: string[] = [];

  if (action === 'snc') {
    if (!clean(state.usuarioAd)) missing.push('usuarioAd');
    return missing;
  }

  if (action === 'encerramento') {
    if (!clean(state.chamado)) missing.push('chamado');
    if (!clean(state.abertoPor) && !clean(state.nomeCompleto)) missing.push('abertoPor');
    return missing;
  }

  if (!clean(state.chamado)) missing.push('chamado');

  if (action === 'anexo' || action === 'servnow') {
    if (!clean(state.abertoPor)) missing.push('abertoPor');
    if (!clean(state.ambiente)) missing.push('ambiente');
  }

  if (action === 'servnow' && !clean(state.grcRequestNumber)) {
    missing.push('grcRequestNumber');
  }

  if (state.requestType === 'Delegação de aprovações') {
    if (!clean(state.usuarioAtualAprovador)) missing.push('usuarioAtualAprovador');
    if (!clean(state.usuarioNovoAprovador)) missing.push('usuarioNovoAprovador');
    if (!clean(state.delegarPerfil)) missing.push('delegarPerfil');
  } else {
    if (!clean(state.nomeCompleto)) missing.push('nomeCompleto');
    if (!clean(state.usuarioSap)) missing.push('usuarioSap');
    if (state.requestType === 'Troca de perfil') {
      if (!clean(state.dePerfil)) missing.push('dePerfil');
      if (!clean(state.paraPerfil)) missing.push('paraPerfil');
    } else if (state.requestType === 'Prorrogação de acesso') {
      if (!clean(state.prorrogarPerfil)) missing.push('prorrogarPerfil');
    } else {
      if (!clean(state.perfil)) missing.push('perfil');
    }
  }

  return missing;
}

export function generateArmLogAnexo(state: ArmFormState): string {
  const chamado = clean(state.chamado);
  const abertoPor = clean(state.abertoPor);
  const cargoSol = clean(state.cargoSolicitante);
  const deptSol = clean(state.deptSolicitante);
  const ambiente = clean(state.ambiente);
  const solicitacaoLabel =
    state.requestType === 'Atribuição de perfil Temporario'
      ? 'Atribuição de perfil temporário'
      : state.requestType;

  const requesterMeta = [cargoSol, deptSol].filter(Boolean).join(' - ');
  const requesterPart = requesterMeta ? `${abertoPor} (${requesterMeta})` : abertoPor;

  const details = formatArmDetailsBlock(state, 'anexo');

  return [
    'Prezados.',
    '',
    `Recebemos o chamado ${chamado}, relatado por ${requesterPart} com solicitação ${solicitacaoLabel} ao ambiente SAP ${ambiente}, conforme indicado abaixo:`,
    '',
    `Info Ch ${chamado}:`,
    ...details,
  ].join('\n');
}

export function generateArmLog(state: ArmFormState): string {
  const chamado = clean(state.chamado);
  const colaborador = state.terceiro ? 'Terceiro' : 'Funcionário';

  const lines: string[] = ['Log completo em anexo', chamado];

  if (state.requestType === 'Delegação de aprovações') {
    lines.push(
      `Aprovador Atual: ${clean(state.nomeAtualAprovadorCargo)}/${clean(state.usuarioAtualAprovador)}`
    );
    lines.push(
      `Novo Aprovador: ${clean(state.nomeNovoAprovadorCargo)}/${clean(state.usuarioNovoAprovador)}`
    );
    lines.push(`Tipo do colaborador: ${colaborador}`);
    lines.push('');
    lines.push(`Perfis: ${clean(state.delegarPerfil)}`);
  } else {
    lines.push(`Nome: ${clean(state.nomeCompleto)}/${clean(state.usuarioSap)}`);
    lines.push(`${clean(state.cargo)} , ${clean(state.departamento)}`);
    lines.push(`Tipo do colaborador: ${colaborador}`);
    lines.push('');
    lines.push(`Usuário cópia: ${clean(state.usuarioCopiaSap)}`);

    if (state.requestType === 'Troca de perfil') {
      lines.push(`De perfil: ${clean(state.dePerfil)}`);
      lines.push(`Para perfil: ${clean(state.paraPerfil)}`);
    } else if (state.requestType === 'Prorrogação de acesso') {
      lines.push(`Perfis: ${clean(state.prorrogarPerfil)}`);
    } else {
      lines.push(`Perfis: ${clean(state.perfil)}`);
    }
  }

  const validity = formatValidityLines(state);
  if (validity.length > 0) {
    lines.push(...validity);
  }

  return lines.join('\n');
}

export function generateArmLogServNow(state: ArmFormState, signature: string): string {
  const abertoPor = clean(state.abertoPor);
  const grc = clean(state.grcRequestNumber);
  const chamado = clean(state.chamado);
  const cargoSol = clean(state.cargoSolicitante);
  const deptSol = clean(state.deptSolicitante);
  const ambiente = clean(state.ambiente);
  const solicitacaoLabel =
    state.requestType === 'Atribuição de perfil Temporario'
      ? 'Atribuição de perfil temporário'
      : state.requestType;

  const requesterMeta = [cargoSol, deptSol].filter(Boolean).join(' - ');
  const requesterPart = requesterMeta ? `${abertoPor} (${requesterMeta})` : abertoPor;
  const details = formatArmDetailsBlock(state, 'servnow');

  return [
    `Prezado(a) ${abertoPor}.`,
    `Foi aberto no GRC AC a solicitação ${grc}, para a validação dos respectivos Aprovadores dentro do sistema SAP GRC - AC.`,
    '----------------------------------------------------------',
    'Detalhes da solicitação.',
    '',
    'Prezados.',
    '',
    `Recebemos o chamado ${chamado}, relatado por ${requesterPart} com solicitação ${solicitacaoLabel} ao ambiente SAP ${ambiente}, conforme indicado abaixo:`,
    '',
    `Info Ch ${chamado}:`,
    ...details,
    '',
    signature.trim(),
  ].join('\n');
}

export function generateArmLogEncerramento(state: ArmFormState, signature: string): string {
  const destinatario = clean(state.abertoPor) || clean(state.nomeCompleto);
  const chamado = clean(state.chamado);
  const usuario =
    state.requestType === 'Delegação de aprovações'
      ? clean(state.usuarioNovoAprovador)
      : clean(state.usuarioSap);
  const ambiente = clean(state.ambiente);
  const perfilInfo =
    state.requestType === 'Troca de perfil'
      ? `${clean(state.dePerfil)} -> ${clean(state.paraPerfil)}`
      : state.requestType === 'Prorrogação de acesso'
        ? clean(state.prorrogarPerfil)
        : state.requestType === 'Delegação de aprovações'
          ? clean(state.delegarPerfil)
          : clean(state.perfil);

  const lines: string[] = [`Prezado(a) ${destinatario}.`];

  if (state.reprovado) {
    lines.push(
      `Informamos que a solicitação referente ao chamado ${chamado} no SAP GRC - AC foi REPROVADA pelo(s) aprovador(es) responsável(is).`
    );
    if (clean(state.grcRequestNumber)) {
      lines.push(`Solicitação GRC: ${clean(state.grcRequestNumber)}`);
    }
    lines.push(
      'Caso o acesso ainda seja necessário, favor abrir uma nova solicitação com a justificativa alinhada junto ao gestor aprovador.'
    );
  } else if (state.expirado) {
    lines.push(
      `Informamos que a solicitação referente ao chamado ${chamado} no SAP GRC - AC EXPIRADA por ausência de aprovação dentro do prazo limite.`
    );
    if (clean(state.grcRequestNumber)) {
      lines.push(`Solicitação GRC: ${clean(state.grcRequestNumber)}`);
    }
    lines.push(
      'Para prosseguir com a liberação do acesso, favor abrir uma nova requisição e alinhar a aprovação junto ao gestor responsável.'
    );
  } else {
    const portalNote = state.portal ? ' (incluindo acesso ao Portal)' : '';
    lines.push(
      `A solicitação referente ao chamado ${chamado} (${state.requestType})${portalNote} foi concluída com sucesso no ambiente ${ambiente}.`
    );
    if (usuario || perfilInfo) {
      lines.push('');
      if (usuario) lines.push(`Usuário SAP: ${usuario}`);
      if (perfilInfo) lines.push(`Perfil/Função: ${perfilInfo}`);
      const validity = formatValidityLines(state);
      lines.push(...validity);
    }
  }

  if (clean(state.textoEmailEncerramento)) {
    lines.push('');
    lines.push('Detalhes / Retorno GRC:');
    lines.push(clean(state.textoEmailEncerramento));
  }

  lines.push('');
  lines.push(signature.trim());

  return lines.join('\n');
}

export function generateSncString(usuarioAd: string, defaultDomain = 'PRATIKA.BR'): string {
  const raw = clean(usuarioAd)
    .replace(/^p:CN=/i, '')
    .toUpperCase();
  if (!raw) return '';
  if (raw.includes('@')) {
    return `p:CN=${raw}`;
  }
  const domain = clean(defaultDomain).replace(/^@/, '').toUpperCase() || 'PRATIKA.BR';
  return `p:CN=${raw}@${domain}`;
}

export function validateBrmForm(
  state: BrmFormState,
  action: 'tecnico' | 'cobranca' | 'motivo'
): string[] {
  const missing: string[] = [];
  if (!clean(state.numeroChamado)) missing.push('numeroChamado');
  if (!clean(state.nomeSolicitante)) missing.push('nomeSolicitante');

  if (action === 'cobranca') {
    if (!clean(state.ambiente)) missing.push('ambiente');
  }

  if (action === 'tecnico') {
    if (!clean(state.usuarioSap)) missing.push('usuarioSap');
    if (!clean(state.perfilMestre) && !clean(state.perfilDerivado)) {
      missing.push('perfilMestre');
    }
  }

  return missing;
}

export function generateBrmCobrancaEmail(state: BrmFormState, signature: string): string {
  const nome = clean(state.nomeSolicitante);
  const chamado = clean(state.numeroChamado);
  const ambiente = clean(state.ambiente);

  return [
    `Prezado(a) ${nome}.`,
    `A alteração referente à solicitação ${chamado} foi efetuada e está disponível para testes no ambiente - ${ambiente}.`,
    '',
    'Por gentileza, teste toda a funcionalidade da transação e anexe as telas como evidência de utilização e responda a este e-mail para aplicarmos em produção.',
    'Caso ocorra falta de autorização ou erro, anexar a tela do erro e também a tela da /NSU53 no formato HTML.',
    '',
    signature.trim(),
  ].join('\n');
}

export function generateBrmLogTecnico(state: BrmFormState): string {
  const chamado = clean(state.numeroChamado);
  const nome = clean(state.nomeSolicitante);
  const transacoes = clean(state.transacoes) || (state.alteracaoSomenteNivelOrg ? 'Alteração somente de Nível Organizacional' : '-');
  const objetos = clean(state.objetoNivelOrg) || '-';
  const perfilMestre = clean(state.perfilMestre) || '-';
  const perfilDerivado = clean(state.perfilDerivado) || '-';
  const usuarioSap = clean(state.usuarioSap);

  return [
    'Informações técnicas',
    `Solicitação: ${chamado}`,
    `Conforme solicitação do(a) Colaborador(a): ${nome}`,
    '',
    'Transaçãoes inclusas:',
    transacoes,
    '',
    'Objetos:',
    objetos,
    '',
    'Perfil mestre',
    perfilMestre,
    '',
    'Perfil Derivado',
    perfilDerivado,
    '',
    'Usuário teste:',
    usuarioSap,
    '',
    'Perfil de teste:',
    `TST_CHAMADO_${chamado}`,
  ].join('\n');
}

export function generateBrmLogMotivo(state: BrmFormState): string {
  const chamado = clean(state.numeroChamado);
  const nome = clean(state.nomeSolicitante);
  const usuarioSap = clean(state.usuarioSap);

  const lines: string[] = [
    `Motivo da Manutenção — ${state.tipo}`,
    `Solicitação: ${chamado}`,
    `Solicitante: ${nome}${usuarioSap ? ` (${usuarioSap})` : ''}`,
    `Ambiente: ${clean(state.ambiente) || '-'}`,
    '',
    `Tipo de alteração: ${state.tipo}`,
    `Alteração somente de Nível Organizacional: ${state.alteracaoSomenteNivelOrg ? 'Sim' : 'Não'}`,
    '',
    'Transações Utilizadas (função já possui):',
    clean(state.transacoesUtilizadas) || '-',
    '',
    'Transações incluídas / ajustadas:',
    clean(state.transacoes) || '-',
    '',
    `Perfil Mestre: ${clean(state.perfilMestre) || '-'}`,
    `Perfil Derivado: ${clean(state.perfilDerivado) || '-'}`,
  ];

  if (clean(state.detalhesServiceNow)) {
    lines.push('');
    lines.push('Detalhes da solicitação no Service Now:');
    lines.push(clean(state.detalhesServiceNow));
  }

  return lines.join('\n');
}

export function generateArmLegadosLog(
  state: ArmLegadosState,
  mode: 'log' | 'anexo' | 'email',
  signature: string
): string {
  const colaborador = state.terceiro ? 'Terceiro' : 'Funcionário';
  const requesterMeta = [clean(state.cargoSolicitante), clean(state.deptSolicitante)]
    .filter(Boolean)
    .join(' - ');
  const requesterPart = requesterMeta
    ? `${clean(state.abertoPor)} (${requesterMeta})`
    : clean(state.abertoPor);

  if (mode === 'log') {
    return [
      `Log Sistema Legado — ${clean(state.sistemaLegado)}`,
      clean(state.chamado),
      `Ação: ${state.tipoAcao}`,
      `Nome: ${clean(state.nomeCompleto)} / ${clean(state.loginUsuario)}`,
      `${clean(state.cargo)}, ${clean(state.departamento)}`,
      colaborador,
      `Perfil/Acesso: ${clean(state.perfilAcesso)}`,
      ...(clean(state.observacoes) ? [`Observações: ${clean(state.observacoes)}`] : []),
    ].join('\n');
  }

  const body = [
    'Prezados.',
    '',
    `Recebemos o chamado ${clean(state.chamado)}, relatado por ${requesterPart}, referente à solicitação de ${state.tipoAcao} no sistema legado ${clean(state.sistemaLegado)}:`,
    '',
    `Nome/Login: ${clean(state.nomeCompleto)} / ${clean(state.loginUsuario)}`,
    `Cargo/Departamento: ${clean(state.cargo)}, ${clean(state.departamento)}`,
    `Tipo do colaborador: ${colaborador}`,
    `Perfil/Acesso: ${clean(state.perfilAcesso)}`,
    ...(clean(state.observacoes) ? [`Observações: ${clean(state.observacoes)}`] : []),
  ];

  if (mode === 'email') {
    body.push('', signature.trim());
  }

  return body.join('\n');
}

export function generateArmMultiploLog(
  state: ArmMultiploState,
  mode: 'anexo' | 'servnow',
  signature: string
): string {
  const requesterMeta = [clean(state.cargoSolicitante), clean(state.deptSolicitante)]
    .filter(Boolean)
    .join(' - ');
  const requesterPart = requesterMeta
    ? `${clean(state.abertoPor)} (${requesterMeta})`
    : clean(state.abertoPor);

  const lines: string[] = [];

  if (mode === 'servnow') {
    lines.push(`Prezado(a) ${clean(state.abertoPor)}.`);
    lines.push(
      `Foi aberto no GRC AC a solicitação ${clean(state.grcRequestNumber)}, para a validação dos respectivos Aprovadores dentro do sistema SAP GRC - AC.`
    );
    lines.push('----------------------------------------------------------');
    lines.push('Detalhes da solicitação.');
    lines.push('');
  }

  lines.push('Prezados.');
  lines.push('');
  lines.push(
    `Recebemos o chamado ${clean(state.chamado)}, relatado por ${requesterPart} com solicitação múltipla (${state.tipoSolicitacao}) ao ambiente SAP ${clean(state.ambiente)}, conforme relação abaixo:`
  );
  lines.push('');
  lines.push(`Tipo do colaborador: ${state.terceiro ? 'Terceiro' : 'Funcionário'}`);
  lines.push(`Total de usuários: ${state.linhas.length}`);
  lines.push('');

  state.linhas.forEach((row, index) => {
    lines.push(`[${index + 1}] Nome/Usuário: ${clean(row.nomeCompleto)} / ${clean(row.usuarioSap)}`);
    lines.push(`    Cargo/Departamento: ${clean(row.cargo)}, ${clean(row.departamento)}`);
    lines.push(`    Perfil: ${clean(row.perfil)}`);
    lines.push(`    Usuário cópia: ${clean(row.usuarioCopia) || '-'}`);
  });

  if (mode === 'servnow') {
    lines.push('');
    lines.push(signature.trim());
  }

  return lines.join('\n');
}

export function generateStandaloneEncerramento(
  state: EncerramentoStandaloneState,
  signature: string
): string {
  const titulo =
    state.modulo === 'ARM' ? 'Atribuição de Acesso (ARM)' : 'Manutenção de Função (BRM)';
  const lines: string[] = [
    `Prezado(a) ${clean(state.solicitante)}.`,
    '',
    `Referente ao chamado ${clean(state.chamado)} (${titulo}) no ambiente ${clean(state.ambiente)}:`,
  ];

  if (state.status === 'Concluído') {
    const portalSuffix = state.portal ? ' (com atualização de acesso ao Portal)' : '';
    lines.push(`Informamos que a solicitação foi concluída e aplicada com sucesso${portalSuffix}.`);
  } else if (state.status === 'Reprovado') {
    lines.push('Informamos que a solicitação foi encerrada como REPROVADA pelo fluxo de aprovação.');
  } else if (state.status === 'Expirado') {
    lines.push('Informamos que a solicitação foi encerrada como EXPIRADA por prazo de aprovação vencido.');
  } else {
    lines.push('Informamos que a solicitação foi CANCELADA conforme tratativa registrada no chamado.');
  }

  if (clean(state.usuarioSap) || clean(state.perfisOuFuncoes)) {
    lines.push('');
    if (clean(state.usuarioSap)) lines.push(`Usuário SAP: ${clean(state.usuarioSap)}`);
    if (clean(state.perfisOuFuncoes)) lines.push(`Perfis / Funções: ${clean(state.perfisOuFuncoes)}`);
  }

  if (clean(state.textoBase)) {
    lines.push('');
    lines.push('Observações adicionais:');
    lines.push(clean(state.textoBase));
  }

  lines.push('');
  lines.push(signature.trim());

  return lines.join('\n');
}

export interface ParsedServiceNowFields {
  numeroChamado?: string;
  nomeSolicitante?: string;
  usuarioSap?: string;
  perfilMestre?: string;
  perfilDerivado?: string;
  transacoes?: string;
  ambiente?: string;
}

export function parseServiceNowText(raw: string): ParsedServiceNowFields {
  const text = raw.trim();
  if (!text) return {};

  const result: ParsedServiceNowFields = {};

  const ticketMatch = text.match(/\b((?:TASK|RITM|REQ|INC|SCTASK)\d{4,})\b/i);
  if (ticketMatch) {
    result.numeroChamado = ticketMatch[1].toUpperCase();
  }

  const nameMatch = text.match(/(?:Solicitante|Nome|Colaborador|Aberto por)\s*[:\-]\s*([^\n\r]+)/i);
  if (nameMatch) {
    result.nomeSolicitante = nameMatch[1].trim();
  }

  const userMatch = text.match(/(?:Usu[áa]rio\s*SAP|User\s*SAP|Login)\s*[:\-]\s*([A-Z0-9._-]+)/i);
  if (userMatch) {
    result.usuarioSap = userMatch[1].trim().toUpperCase();
  }

  const roleMatch = text.match(/\b(Z[A-Z0-9_:]+\d{3,}(?:_\d{4})?)\b/g);
  if (roleMatch && roleMatch.length > 0) {
    const derived = roleMatch.find((r) => /_\d{4}$/.test(r));
    const master = roleMatch.find((r) => !/_\d{4}$/.test(r));
    if (master) result.perfilMestre = master;
    if (derived) result.perfilDerivado = derived;
  }

  const tcodeMatch = text.match(/(?:Transa[çc][ãa]o|Transa[çc][õo]es|T-?Code)\s*[:\-]\s*([^\n\r]+)/i);
  if (tcodeMatch) {
    result.transacoes = tcodeMatch[1].trim().toUpperCase();
  }

  const envMatch = SAP_ENVIRONMENTS.filter((env) => !env.includes('------')).find((env) => {
    const code = env.split(')')[0]; // e.g. '07'
    const namePart = env.split(')')[1].trim().toLowerCase(); // e.g. 'sap erp qualidade'
    return (
      new RegExp(`\\b${code}\\b`).test(text) ||
      text.toLowerCase().includes(namePart) ||
      (namePart.includes('qualidade') && /qualidade|eq1/i.test(text)) ||
      (namePart.includes('produção') && /produção|ep1/i.test(text))
    );
  }) || SAP_ENVIRONMENTS.find((env) => text.toLowerCase().includes(env.toLowerCase()));
  if (envMatch) {
    result.ambiente = envMatch;
  }

  return result;
}
