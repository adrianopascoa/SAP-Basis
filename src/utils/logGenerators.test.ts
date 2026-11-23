import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SIGNATURE,
  DEFAULT_ARM_STATE,
  DEFAULT_BRM_STATE,
  generateArmLogAnexo,
  generateArmLog,
  generateArmLogServNow,
  generateArmLogEncerramento,
  generateSncString,
  generateBrmCobrancaEmail,
  generateBrmLogTecnico,
  generateBrmLogMotivo,
  generateArmMultiploLog,
  parseServiceNowText,
  validateArmForm,
  validateBrmForm,
} from './logGenerators';

test('ARM Gerar Log Anexo matches prompt specification for Criação de usuário', () => {
  const output = generateArmLogAnexo({
    ...DEFAULT_ARM_STATE,
    requestType: 'Criação de usuário',
    chamado: 'RITM001234',
    abertoPor: 'Usuário exemplo',
    cargoSolicitante: 'Cargo exemplo',
    deptSolicitante: 'Departamento exemplo',
    ambiente: 'Ambiente',
    nomeCompleto: 'Nome exemplo',
    usuarioSap: 'User SAP',
    cargo: 'Cargo',
    departamento: 'Departamento',
    perfil: 'Perfil',
    terceiro: false,
    usuarioCopiaSap: 'User cópia',
  });

  const expected = `Prezados.

Recebemos o chamado RITM001234, relatado por Usuário exemplo (Cargo exemplo - Departamento exemplo) com solicitação Criação de usuário ao ambiente SAP Ambiente, conforme indicado abaixo:

Info Ch RITM001234:
Nome/Usuário: Nome exemplo / User SAP
Cargo/Departamento: Cargo, Departamento
Perfil: Perfil
Tipo do colaborador: Funcionário
Usuário cópia: User cópia`;

  assert.equal(output, expected);
});

test('ARM Gerar Log matches prompt compact specification', () => {
  const output = generateArmLog({
    ...DEFAULT_ARM_STATE,
    chamado: 'RITM001234',
    nomeCompleto: 'Nome exemplo',
    usuarioSap: 'User SAP',
    cargo: 'Cargo',
    departamento: 'Departamento',
    perfil: 'Perfil',
    terceiro: false,
    usuarioCopiaSap: 'User cópia',
  });

  const expected = `Log completo em anexo
RITM001234
Nome: Nome exemplo/User SAP
Cargo , Departamento
Tipo do colaborador: Funcionário

Usuário cópia: User cópia
Perfis: Perfil`;

  assert.equal(output, expected);

  const outputTerceiro = generateArmLog({
    ...DEFAULT_ARM_STATE,
    chamado: 'RITM001234',
    nomeCompleto: 'Nome exemplo',
    usuarioSap: 'User SAP',
    cargo: 'Cargo',
    departamento: 'Departamento',
    perfil: 'Perfil',
    terceiro: true,
    usuarioCopiaSap: 'User cópia',
  });
  assert.match(outputTerceiro, /\nTipo do colaborador: Terceiro\n/);
});

test('ARM Gerar Log Serv. Now matches prompt specification with GRC number and signature', () => {
  const output = generateArmLogServNow(
    {
      ...DEFAULT_ARM_STATE,
      grcRequestNumber: '1234',
      chamado: 'RITM001234',
      abertoPor: 'Usuário exemplo',
      cargoSolicitante: 'Cargo exemplo',
      deptSolicitante: 'Departamento exemplo',
      ambiente: 'Ambiente',
      nomeCompleto: 'Nome exemplo',
      usuarioSap: 'User SAP',
      cargo: 'Cargo',
      departamento: 'Departamento',
      perfil: 'Perfil',
      terceiro: false,
      usuarioCopiaSap: 'User cópia',
    },
    DEFAULT_SIGNATURE,
    new Date(2026, 10, 23)
  );

  assert.match(output, /^Prezado\(a\) Usuário exemplo\./);
  assert.match(output, /Foi aberto no GRC AC a solicitação 1234/);
  assert.match(
    output,
    /1º Aprovador – NOME - Aguardando aprovação\.\n2º Aprovador – NOME - Aguardando aprovação\.\nSe não ocorrer aprovação até a data 01\.12\.2026, o chamado será cancelado automaticamente por falta de aprovação\.\n----------------------------------------------------------/
  );
  assert.match(output, /Cargo: Cargo, Departamento/);
  assert.match(output, /Tipo do colaborador: Funcionario/);
  assert.match(output, /Usuário copia: User cópia/);
  assert.match(output, /NOME\| Application Management Services SAP Basis/);

  const outputWithApprovers = generateArmLogServNow(
    {
      ...DEFAULT_ARM_STATE,
      grcRequestNumber: '1234',
      chamado: 'RITM001234',
      abertoPor: 'Usuário exemplo',
      ambiente: 'Ambiente',
      nomeCompleto: 'Nome exemplo',
      usuarioSap: 'User SAP',
      aprovador1: 'Maria Aprovadora',
      aprovador2: 'Carlos Gestor',
    },
    DEFAULT_SIGNATURE,
    new Date(2026, 10, 23)
  );
  assert.match(
    outputWithApprovers,
    /1º Aprovador – Maria Aprovadora - Aguardando aprovação\.\n2º Aprovador – Carlos Gestor - Aguardando aprovação\./
  );
});

test('ARM switches cleanly for Troca de perfil, Delegação de aprovações, and Terceiro validity', () => {
  const troca = generateArmLogAnexo({
    ...DEFAULT_ARM_STATE,
    requestType: 'Troca de perfil',
    chamado: 'CHG999',
    abertoPor: 'Ana',
    ambiente: 'EP1',
    nomeCompleto: 'Carlos',
    usuarioSap: 'CSILVA',
    cargo: 'Analista',
    departamento: 'TI',
    dePerfil: 'Z_OLD',
    paraPerfil: 'Z_NEW',
    terceiro: true,
    porData: true,
    dataDe: '20.11.2026',
    dataAte: '31.12.2026',
  });

  assert.match(troca, /De perfil: Z_OLD/);
  assert.match(troca, /Para perfil: Z_NEW/);
  assert.match(troca, /Tipo do colaborador: Terceiro/);
  assert.match(troca, /Período: De 20\.11\.2026 até 31\.12\.2026/);

  const delegacao = generateArmLogAnexo({
    ...DEFAULT_ARM_STATE,
    requestType: 'Delegação de aprovações',
    chamado: 'REQ777',
    abertoPor: 'Maria',
    ambiente: 'GP1',
    nomeAtualAprovadorCargo: 'João / Gerente',
    usuarioAtualAprovador: 'JGERENTE',
    nomeNovoAprovadorCargo: 'Pedro / Coordenador',
    usuarioNovoAprovador: 'PCOORD',
    delegarPerfil: 'Z_APROVADOR_MM',
    emDias: true,
    dias: '15',
  });

  assert.match(delegacao, /Aprovador Atual: João \/ Gerente \/ JGERENTE/);
  assert.match(delegacao, /Novo Aprovador: Pedro \/ Coordenador \/ PCOORD/);
  assert.match(delegacao, /Delegar perfil: Z_APROVADOR_MM/);
  assert.match(delegacao, /Período: 15 dias/);
});

test('ARM Gerar SNC formats AD user to p:CN=...', () => {
  assert.equal(generateSncString('adriano.pascoa'), 'p:CN=ADRIANO.PASCOA@PRATIKA.BR');
  assert.equal(
    generateSncString('ADRIANO.PASCOA@PRATIKA.BR'),
    'p:CN=ADRIANO.PASCOA@PRATIKA.BR'
  );
  assert.equal(
    generateSncString('p:CN=maria.silva@empresa.com'),
    'p:CN=MARIA.SILVA@EMPRESA.COM'
  );
});

test('ARM Gerar Log Encerramento handles Reprovado, Expirado, and Portal', () => {
  const reprovado = generateArmLogEncerramento(
    {
      ...DEFAULT_ARM_STATE,
      abertoPor: 'Lucas',
      chamado: 'REQ100',
      reprovado: true,
      grcRequestNumber: '8812',
    },
    DEFAULT_SIGNATURE
  );
  assert.match(reprovado, /REPROVADA/);
  assert.match(reprovado, /Solicitação GRC: 8812/);

  const normal = generateArmLogEncerramento(
    {
      ...DEFAULT_ARM_STATE,
      abertoPor: 'Lucas',
      chamado: 'REQ100',
      usuarioSap: 'LMENDES',
      perfil: 'Z_FI_USER',
      ambiente: 'EP1',
      portal: true,
    },
    DEFAULT_SIGNATURE
  );
  assert.match(normal, /incluindo acesso ao Portal/);
  assert.match(normal, /Usuário SAP: LMENDES/);
});

test('BRM Gerar e-mail de cobrança matches prompt specification verbatim', () => {
  const output = generateBrmCobrancaEmail(
    {
      ...DEFAULT_BRM_STATE,
      nomeSolicitante: 'Thiago Andrade Da Silva',
      numeroChamado: 'TASK1520305',
      ambiente: '07) SAP ERP Qualidade - EQ1',
    },
    DEFAULT_SIGNATURE
  );

  const expected = `Prezado(a) Thiago Andrade Da Silva.
A alteração referente à solicitação TASK1520305 foi efetuada e está disponível para testes no ambiente - 07) SAP ERP Qualidade - EQ1.

Por gentileza, teste toda a funcionalidade da transação e anexe as telas como evidência de utilização e responda a este e-mail para aplicarmos em produção.
Caso ocorra falta de autorização ou erro, anexar a tela do erro e também a tela da /NSU53 no formato HTML.

Você receberá uma Pesquisa de Satisfação em seu e-mail quando este chamado for encerrado. Sua avaliação é fundamental para que possamos aprimorar nosso atendimento.
NOME| Application Management Services SAP Basis

Atenciosamente,`;

  assert.equal(output, expected);
});

test('BRM Gerar log técnico matches prompt specification verbatim', () => {
  const output = generateBrmLogTecnico({
    ...DEFAULT_BRM_STATE,
    nomeSolicitante: 'Thiago Andrade Da Silva',
    numeroChamado: 'TASK1520305',
    usuarioSap: 'TASILVA07',
    transacoes: 'SE16N',
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
  });

  const expected = `Informações técnicas
Solicitação: TASK1520305
Conforme solicitação do(a) Colaborador(a): Thiago Andrade Da Silva

Transaçãoes inclusas:
SE16N

Objetos:
Q_INSPPNT
ACTVT: 03
ARBPL: CQ.CP
QINSPPNTTY: 3
QMATAUTH: Z00005
QPRUEFART: Z0104
WERKS: 5001

S_GUI
ACTVT: 02

Perfil mestre
ZF:QM_CQ_PA_SR_ANL_001

Perfil Derivado
ZF:QM_CQ_PA_SR_ANL_001_0001

Usuário teste:
TASILVA07

Perfil de teste:
TST_CHAMADO_TASK1520305`;

  assert.equal(output, expected);
});

test('BRM Gerar log Motivo and ServiceNow parser work deterministically', () => {
  const motivo = generateBrmLogMotivo({
    ...DEFAULT_BRM_STATE,
    nomeSolicitante: 'Thiago Andrade Da Silva',
    numeroChamado: 'TASK1520305',
    usuarioSap: 'TASILVA07',
    tipo: 'Modificar função derivada',
    alteracaoSomenteNivelOrg: true,
    transacoesUtilizadas: 'QA32',
    transacoes: 'SE16N',
    perfilMestre: 'ZF:QM_CQ_PA_SR_ANL_001',
    perfilDerivado: 'ZF:QM_CQ_PA_SR_ANL_001_0001',
    detalhesServiceNow: 'Ajuste de centro 5001',
  });

  assert.match(motivo, /Motivo da Manutenção — Modificar função derivada/);
  assert.match(motivo, /Alteração somente de Nível Organizacional: Sim/);
  assert.match(motivo, /Ajuste de centro 5001/);

  const parsed = parseServiceNowText(
    'Chamado TASK1520305\nSolicitante: Thiago Andrade Da Silva\nUsuário SAP: tasilva07\nTransação: SE16N\nFunção ZF:QM_CQ_PA_SR_ANL_001 e ZF:QM_CQ_PA_SR_ANL_001_0001 para 07) SAP ERP Qualidade'
  );
  assert.equal(parsed.numeroChamado, 'TASK1520305');
  assert.equal(parsed.nomeSolicitante, 'Thiago Andrade Da Silva');
  assert.equal(parsed.usuarioSap, 'TASILVA07');
  assert.equal(parsed.transacoes, 'SE16N');
  assert.equal(parsed.perfilMestre, 'ZF:QM_CQ_PA_SR_ANL_001');
  assert.equal(parsed.perfilDerivado, 'ZF:QM_CQ_PA_SR_ANL_001_0001');
  assert.equal(parsed.ambiente, '07) SAP ERP Qualidade');
});

test('Validation detects missing required fields and multi-user generator lists all rows', () => {
  const armMissing = validateArmForm(DEFAULT_ARM_STATE, 'servnow');
  assert.ok(armMissing.includes('chamado'));
  assert.ok(armMissing.includes('grcRequestNumber'));

  const brmMissing = validateBrmForm(DEFAULT_BRM_STATE, 'tecnico');
  assert.ok(brmMissing.includes('numeroChamado'));
  assert.ok(brmMissing.includes('usuarioSap'));

  const multi = generateArmMultiploLog(
    {
      chamado: 'REQ900',
      grcRequestNumber: '4455',
      abertoPor: 'Juliana',
      cargoSolicitante: 'Gerente',
      deptSolicitante: 'Compras',
      ambiente: '01) SAP ERP Produção - EP1',
      tipoSolicitacao: 'Criação de usuário',
      terceiro: false,
      linhas: [
        {
          id: '1',
          nomeCompleto: 'João Um',
          usuarioSap: 'JUM01',
          cargo: 'Comprador',
          departamento: 'Compras',
          perfil: 'Z_MM_COMP',
          usuarioCopia: 'JBASE',
        },
        {
          id: '2',
          nomeCompleto: 'Maria Dois',
          usuarioSap: 'MDOIS02',
          cargo: 'Compradora',
          departamento: 'Compras',
          perfil: 'Z_MM_COMP',
          usuarioCopia: 'JBASE',
        },
      ],
    },
    'servnow',
    DEFAULT_SIGNATURE
  );

  assert.match(multi, /Total de usuários: 2/);
  assert.match(multi, /\[1\] Nome\/Usuário: João Um \/ JUM01/);
  assert.match(multi, /\[2\] Nome\/Usuário: Maria Dois \/ MDOIS02/);
});
