import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStoredCustomTemplates,
  parseStoredHistory,
  parseStoredImportantLinks,
  parseStoredStringArray,
  sanitizeHttpUrl,
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

test('sanitizeHttpUrl and parseStoredImportantLinks only permit valid http/https links', () => {
  assert.equal(sanitizeHttpUrl('https://portal.empresa.com/sap'), 'https://portal.empresa.com/sap');
  assert.equal(sanitizeHttpUrl('portal.empresa.com/sap'), 'https://portal.empresa.com/sap');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(sanitizeHttpUrl('   '), null);

  const payload = JSON.stringify([
    { id: 'link-1', label: 'Portal BTP', url: 'https://ae1tmgugt.accounts.ondemand.com/admin/' },
    { id: 'link-xss', label: 'Malicioso', url: 'javascript:alert(1)' },
    { id: 'link-empty', label: '', url: 'https://example.com' },
  ]);

  const parsed = parseStoredImportantLinks(payload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'link-1');
  assert.equal(parsed[0].isCustom, true);
});
