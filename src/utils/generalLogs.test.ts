import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GENERAL_LOG_VALUES,
  EXAMPLE_GENERAL_LOG_VALUES,
  GENERAL_LOG_TEMPLATES,
  detectUnfilledPlaceholders,
  extractCustomTemplateVariables,
  filterAndSortGeneralTemplates,
  generateCustomGeneralLog,
  generateGeneralLog,
  getDatePlusDays,
  getDefaultPassword,
  getTimeOfDayGreeting,
} from './generalLogs';
import { DEFAULT_SIGNATURE } from './logGenerators';

test('getTimeOfDayGreeting returns Bom dia, Boa tarde, and Boa noite according to hour', () => {
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 5, 0, 0)), 'Bom dia');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 9, 30, 0)), 'Bom dia');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 11, 59, 0)), 'Bom dia');

  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 12, 0, 0)), 'Boa tarde');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 14, 45, 0)), 'Boa tarde');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 17, 59, 0)), 'Boa tarde');

  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 18, 0, 0)), 'Boa noite');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 22, 15, 0)), 'Boa noite');
  assert.equal(getTimeOfDayGreeting(new Date(2026, 10, 21, 2, 30, 0)), 'Boa noite');
});

test('getDefaultPassword updates year automatically based on current date', () => {
  assert.equal(getDefaultPassword(new Date(2026, 10, 21)), 'Acesso@Hypera2026');
  assert.equal(getDefaultPassword(new Date(2027, 0, 1)), 'Acesso@Hypera2027');
  assert.equal(getDefaultPassword(), `Acesso@Hypera${new Date().getFullYear()}`);
});

test('getDatePlusDays computes DD.MM.YYYY accurately including month rollover', () => {
  assert.equal(getDatePlusDays(8, new Date(2026, 10, 21)), '29.11.2026');
  assert.equal(getDatePlusDays(8, new Date(2026, 11, 28)), '05.01.2027');
});

test('GENERAL_LOG_TEMPLATES exposes all 14 numbered templates (1 to 14) and appends signature', () => {
  assert.equal(GENERAL_LOG_TEMPLATES.length, 14);

  const afternoon = new Date(2026, 10, 21, 15, 0, 0);
  GENERAL_LOG_TEMPLATES.forEach((tpl, index) => {
    assert.ok(
      tpl.title.startsWith(`${index + 1}) `),
      `Expected template ${tpl.id} to start with "${index + 1}) ", got "${tpl.title}"`
    );
    const out = generateGeneralLog(tpl.id, EXAMPLE_GENERAL_LOG_VALUES, DEFAULT_SIGNATURE, {
      now: afternoon,
    });
    assert.ok(out.endsWith(DEFAULT_SIGNATURE.trim()), `Signature missing on ${tpl.id}`);
    if (tpl.hasGreeting) {
      assert.ok(out.startsWith('Boa tarde'), `Greeting missing on ${tpl.id}`);
    } else {
      assert.ok(out.startsWith('Log técnico'), `Technical header missing on ${tpl.id}`);
    }
  });
});

test('Template 1, 3, 4, 5, 7 tecnico, and 12 format fields and defaults accurately', () => {
  const morning = new Date(2026, 10, 21, 9, 0, 0);

  const t1 = generateGeneralLog('envio-brm-grc', EXAMPLE_GENERAL_LOG_VALUES, DEFAULT_SIGNATURE, {
    now: morning,
  });
  assert.match(t1, /^Bom dia!/);
  assert.match(t1, /dono\(a\) do perfil: DONO\.EXEMPLO/);
  assert.match(t1, /Donos do risco: RISCO1\.EXEMPLO \/ RISCO2\.EXEMPLO/);
  assert.match(t1, /Perfil: Z:EXEMPLO_PERFIL_01/);

  const t3 = generateGeneralLog('falta-aprovacao', DEFAULT_GENERAL_LOG_VALUES, DEFAULT_SIGNATURE, {
    greetingOverride: 'Boa noite',
  });
  assert.match(t3, /^Boa noite!/);
  assert.match(t3, /até a data XXXX o chamado será encerrado/);

  const t4Default = generateGeneralLog('para-senha', DEFAULT_GENERAL_LOG_VALUES, DEFAULT_SIGNATURE, {
    now: morning,
  });
  assert.match(
    t4Default,
    new RegExp(
      `Usuário:\\nSenha: Acesso@Hypera${new Date().getFullYear()}\\nObs: A senha temporária expira em três dias\\.`
    )
  );

  const t4FutureFallback = generateGeneralLog(
    'para-senha',
    { ...DEFAULT_GENERAL_LOG_VALUES, senha: '' },
    DEFAULT_SIGNATURE,
    { now: new Date(2028, 5, 10, 9, 0, 0) }
  );
  assert.match(t4FutureFallback, /Senha: Acesso@Hypera2028/);

  const t5At = generateGeneralLog(
    'encerramento-falta-retorno',
    { ...DEFAULT_GENERAL_LOG_VALUES, solicitante: '@usuario.exemplo' },
    DEFAULT_SIGNATURE,
    { now: morning }
  );
  assert.match(t5At, /Prezado \(a\) @usuario\.exemplo/);

  const t7Tech = generateGeneralLog(
    'tecnico-perfil-aprovador',
    EXAMPLE_GENERAL_LOG_VALUES,
    DEFAULT_SIGNATURE,
    { now: morning }
  );
  assert.match(t7Tech, /^Log técnico\nSolicitação: RITM0000123/);
  assert.match(t7Tech, /Perfil de aprovador – Z:EXEMPLO_APROVADOR_01/);

  const t13 = generateGeneralLog('troca-dono-perfil', EXAMPLE_GENERAL_LOG_VALUES, DEFAULT_SIGNATURE, {
    now: morning,
  });
  assert.match(
    t13,
    /o dono do perfil Z:EXEMPLO_PERFIL_01 \(EXEMPLO\.ANTERIOR\) encontra-se desligado/
  );

  const t14Default = generateGeneralLog(
    'aprovadores-arm',
    { ...DEFAULT_GENERAL_LOG_VALUES, dataLimiteAprovacao: '' },
    DEFAULT_SIGNATURE,
    { now: morning }
  );
  assert.match(t14Default, /1º Aprovador – NOME - Aguardando aprovação\./);
  assert.match(t14Default, /2º Aprovador – NOME1, NOME2, NOME3 - Aguardando aprovação\./);
  assert.match(
    t14Default,
    /Se não ocorrer aprovação até a data 29\.11\.2026, o chamado será cancelado automaticamente por falta de aprovação\./
  );
});

test('detectUnfilledPlaceholders finds XXXX and NOME in body while ignoring NOME in default signature', () => {
  const filledNoPlaceholders = generateGeneralLog(
    'solicitacao-su53',
    EXAMPLE_GENERAL_LOG_VALUES,
    DEFAULT_SIGNATURE,
    { greetingOverride: 'Bom dia' }
  );
  const cleanResult = detectUnfilledPlaceholders(filledNoPlaceholders, DEFAULT_SIGNATURE, []);
  assert.deepEqual(cleanResult.tokens, []);
  assert.deepEqual(cleanResult.missingFields, []);

  const unfilledArm = generateGeneralLog(
    'aprovadores-arm',
    DEFAULT_GENERAL_LOG_VALUES,
    DEFAULT_SIGNATURE,
    { greetingOverride: 'Bom dia' }
  );
  const armResult = detectUnfilledPlaceholders(unfilledArm, DEFAULT_SIGNATURE, [
    '1º Aprovador',
    '2º Aprovador',
  ]);
  assert.deepEqual(armResult.tokens, ['NOME', 'NOME1', 'NOME2', 'NOME3']);
  assert.deepEqual(armResult.missingFields, ['1º Aprovador', '2º Aprovador']);

  const unfilledBrm = generateGeneralLog(
    'envio-brm-grc',
    DEFAULT_GENERAL_LOG_VALUES,
    DEFAULT_SIGNATURE,
    { greetingOverride: 'Bom dia' }
  );
  const brmResult = detectUnfilledPlaceholders(unfilledBrm, DEFAULT_SIGNATURE, [
    'Dono(a) do perfil',
  ]);
  assert.deepEqual(brmResult.tokens, ['XXXX', 'XXXXX']);
  assert.deepEqual(brmResult.missingFields, ['Dono(a) do perfil']);
});

test('extractCustomTemplateVariables and generateCustomGeneralLog interpolate dynamic fields and apply greeting/signature', () => {
  const body = 'Prezado(a) {{Solicitante}},\nSegue evidência do perfil {{Perfil}} ({{Solicitante}}).';
  assert.deepEqual(extractCustomTemplateVariables(body), ['Solicitante', 'Perfil']);

  const customTpl = {
    id: 'custom-1',
    title: '15) Evidência custom',
    description: 'Teste customizado',
    hasGreeting: true,
    bodyTemplate: body,
    updatedAt: '2026-11-21T10:00:00.000Z',
  };

  const withValues = generateCustomGeneralLog(
    customTpl,
    { Solicitante: 'Ana Paula', Perfil: 'ZF:MM_01' },
    DEFAULT_SIGNATURE,
    { greetingOverride: 'Boa tarde' }
  );
  assert.match(withValues, /^Boa tarde!\nPrezado\(a\) Ana Paula,/);
  assert.match(withValues, /perfil ZF:MM_01 \(Ana Paula\)\./);
  assert.ok(withValues.endsWith(DEFAULT_SIGNATURE.trim()));

  const withFallback = generateCustomGeneralLog(
    { ...customTpl, hasGreeting: false },
    { Solicitante: 'Carlos' },
    DEFAULT_SIGNATURE
  );
  assert.ok(withFallback.startsWith('Prezado(a) Carlos,'));
  assert.match(withFallback, /perfil XXXX \(Carlos\)\./);
});

test('filterAndSortGeneralTemplates filters accent-insensitively and pins favorites first', () => {
  const filteredSu53 = filterAndSortGeneralTemplates(GENERAL_LOG_TEMPLATES, 'su53', []);
  assert.equal(filteredSu53.length, 2);
  assert.ok(filteredSu53.some((item) => item.id === 'solicitacao-su53'));

  const filteredQuestionario = filterAndSortGeneralTemplates(
    GENERAL_LOG_TEMPLATES,
    'questionario',
    []
  );
  assert.equal(filteredQuestionario.length, 1);
  assert.equal(filteredQuestionario[0].id, 'solicitacao-questionario');

  const filteredTech = filterAndSortGeneralTemplates(GENERAL_LOG_TEMPLATES, 'tecnico', []);
  assert.ok(filteredTech.some((item) => item.id === 'tecnico-perfil-aprovador'));

  const pinnedFirst = filterAndSortGeneralTemplates(GENERAL_LOG_TEMPLATES, '', [
    'aprovadores-arm',
    'para-senha',
  ]);
  assert.equal(pinnedFirst[0].id, 'para-senha');
  assert.equal(pinnedFirst[1].id, 'aprovadores-arm');
});
