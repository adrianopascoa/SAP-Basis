export type AppRoute =
  | 'hub'
  | 'arm-grc'
  | 'arm-legados'
  | 'arm-multiplo'
  | 'arm-encerramento'
  | 'brm-manutencao'
  | 'brm-legados'
  | 'brm-encerramento'
  | 'logs-gerais'
  | 'historico';

export type BuiltInGeneralLogId =
  | 'envio-brm-grc'
  | 'perfil-transportado-prod'
  | 'falta-aprovacao'
  | 'para-senha'
  | 'encerramento-falta-retorno'
  | 'falso-positivo'
  | 'falso-positivo-funcional'
  | 'tecnico-perfil-aprovador'
  | 'criacao-perfil-aprovador'
  | 'encerramento-remediacao'
  | 'solicitacao-su53'
  | 'solicitacao-questionario'
  | 'troca-dono-perfil'
  | 'aprovadores-arm';

export type GeneralLogId = BuiltInGeneralLogId | (string & {});

export interface CustomGeneralLogTemplate {
  id: string;
  title: string;
  description: string;
  hasGreeting: boolean;
  bodyTemplate: string;
  updatedAt: string;
}

export interface GeneralLogValues {
  solicitante: string;
  donoPerfil: string;
  donosRisco: string;
  perfil: string;
  data: string;
  usuario: string;
  senha: string;
  solicitacao: string;
  colaborador: string;
  novoPerfil: string;
  perfilAprovador: string;
  perfis: string;
  donoAnterior: string;
  aprovador1: string;
  aprovador2: string;
  dataLimiteAprovacao: string;
}

export type ArmRequestType =
  | 'Criação de usuário'
  | 'Troca de perfil'
  | 'Delegação de aprovações'
  | 'Prorrogação de acesso'
  | 'Atribuição de perfil Temporario';

export interface ArmFormState {
  requestType: ArmRequestType;
  terceiro: boolean;
  porData: boolean;
  emDias: boolean;
  dataDe: string;
  dataAte: string;
  dias: string;

  // Requester & Ticket
  abertoPor: string;
  cargoSolicitante: string;
  deptSolicitante: string;
  chamado: string;
  grcRequestNumber: string;

  // Standard User / Profile / Delegation fields
  usuarioCopiaSap: string;
  usuarioSap: string;
  nomeCompleto: string;
  cargo: string;
  departamento: string;
  perfil: string;
  dePerfil: string;
  paraPerfil: string;
  prorrogarPerfil: string;

  // Delegation fields
  usuarioAtualAprovador: string;
  usuarioNovoAprovador: string;
  nomeAtualAprovadorCargo: string;
  nomeNovoAprovadorCargo: string;
  delegarPerfil: string;

  ambiente: string;

  // AD / SNC
  usuarioAd: string;
  adDomain: string;

  // Closure (Encerramento)
  textoEmailEncerramento: string;
  reprovado: boolean;
  expirado: boolean;
  portal: boolean;
}

export type BrmMaintenanceType =
  | 'Modificar função Mestre'
  | 'Modificar função derivada'
  | 'Remediação CI'
  | 'Remediação Keyuser';

export interface BrmFormState {
  nomeSolicitante: string;
  numeroChamado: string;
  usuarioSap: string;
  tipo: BrmMaintenanceType;
  transacoesUtilizadas: string;
  transacoes: string;
  alteracaoSomenteNivelOrg: boolean;
  objetoNivelOrg: string;
  perfilMestre: string;
  perfilDerivado: string;
  ambiente: string;
  detalhesServiceNow: string;
}

export interface ArmLegadosState {
  sistemaLegado: string;
  chamado: string;
  abertoPor: string;
  cargoSolicitante: string;
  deptSolicitante: string;
  nomeCompleto: string;
  loginUsuario: string;
  cargo: string;
  departamento: string;
  perfilAcesso: string;
  tipoAcao: 'Criação' | 'Alteração' | 'Bloqueio' | 'Prorrogação';
  terceiro: boolean;
  observacoes: string;
}

export interface MultiUserRow {
  id: string;
  nomeCompleto: string;
  usuarioSap: string;
  cargo: string;
  departamento: string;
  perfil: string;
  usuarioCopia: string;
}

export interface ArmMultiploState {
  chamado: string;
  grcRequestNumber: string;
  abertoPor: string;
  cargoSolicitante: string;
  deptSolicitante: string;
  ambiente: string;
  tipoSolicitacao: ArmRequestType;
  terceiro: boolean;
  linhas: MultiUserRow[];
}

export interface EncerramentoStandaloneState {
  modulo: 'ARM' | 'BRM';
  chamado: string;
  solicitante: string;
  usuarioSap: string;
  ambiente: string;
  perfisOuFuncoes: string;
  status: 'Concluído' | 'Reprovado' | 'Expirado' | 'Cancelado';
  portal: boolean;
  textoBase: string;
}

export interface LogHistoryEntry {
  id: string;
  createdAt: string;
  area: 'ARM' | 'BRM' | 'GERAIS';
  moduleLabel: string;
  actionLabel: string;
  chamado: string;
  solicitante: string;
  content: string;
}
