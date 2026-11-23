import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStoredCustomTemplates,
  parseStoredHistory,
  parseStoredStringArray,
} from './storageValidation';

test('parseStoredHistory accepts valid entries and rejects corrupted/non-array payloads', () => {
  assert.deepEqual(parseStoredHistory(null), []);
  assert.deepEqual(parseStoredHistory('{invalid json'), []);
  assert.deepEqual(parseStoredHistory('{}'), []);
  assert.deepEqual(parseStoredHistory('123'), []);

  const payload = JSON.stringify([
    {
      id: '1',
      createdAt: '2026-11-22T10:00:00.000Z',
      area: 'ARM',
      moduleLabel: 'ARM · Criação',
      actionLabel: 'Log ARM',
      chamado: 'RITM0001',
      solicitante: 'Maria',
      content: 'Conteúdo seguro',
    },
    {
      id: '2',
      createdAt: '2026-11-22T10:00:00.000Z',
      area: 'INVALID_AREA',
      moduleLabel: 'X',
      actionLabel: 'Y',
      chamado: 'Z',
      solicitante: 'W',
      content: 'bad area',
    },
    null,
    { id: 99, content: 'missing fields' },
  ]);

  const parsed = parseStoredHistory(payload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, '1');
});

test('parseStoredStringArray filters non-strings, empties, and duplicates', () => {
  assert.deepEqual(parseStoredStringArray('{"a": 1}'), []);
  assert.deepEqual(
    parseStoredStringArray(JSON.stringify(['para-senha', 42, '', null, 'para-senha', 'su53'])),
    ['para-senha', 'su53']
  );
});

test('parseStoredCustomTemplates validates template structure and discards malformed entries', () => {
  assert.deepEqual(parseStoredCustomTemplates('not-json'), []);
  assert.deepEqual(parseStoredCustomTemplates('{"__proto__": {"polluted": true}}'), []);

  const payload = JSON.stringify([
    {
      id: 'custom-1',
      title: 'Modelo Seguro',
      description: 'Desc',
      hasGreeting: false,
      bodyTemplate: 'Olá {{Nome}}',
      updatedAt: '2026-11-22T10:00:00.000Z',
    },
    {
      id: 'custom-bad',
      title: '',
      bodyTemplate: 'sem título',
    },
    {
      id: 123,
      title: 'ID numérico inválido',
      bodyTemplate: 'abc',
    },
  ]);

  const parsed = parseStoredCustomTemplates(payload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'custom-1');
  assert.equal(parsed[0].hasGreeting, false);
});
