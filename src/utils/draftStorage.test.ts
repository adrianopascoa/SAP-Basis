import test from 'node:test';
import assert from 'node:assert/strict';
import { clearAllDrafts, clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from './draftStorage';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

test('draftStorage saves and loads typed draft merged with fallback defaults', () => {
  const storage = createMemoryStorage();
  const defaults = { chamado: '', ambiente: 'ECP/EQ1', thirdParty: false };

  saveDraft(DRAFT_KEYS.ARM_GRC, { chamado: 'RITM0012345', thirdParty: true }, storage);

  const loaded = loadDraft(DRAFT_KEYS.ARM_GRC, defaults, storage);
  assert.deepEqual(loaded, {
    chamado: 'RITM0012345',
    ambiente: 'ECP/EQ1',
    thirdParty: true,
  });
});

test('draftStorage returns fallback when payload is corrupted or non-object', () => {
  const storage = createMemoryStorage();
  const defaults = { chamado: '', nome: '' };

  storage.setItem(DRAFT_KEYS.BRM_MANUTENCAO, '{invalid-json');
  assert.deepEqual(loadDraft(DRAFT_KEYS.BRM_MANUTENCAO, defaults, storage), defaults);

  storage.setItem(DRAFT_KEYS.BRM_MANUTENCAO, JSON.stringify(['not', 'an', 'object']));
  assert.deepEqual(loadDraft(DRAFT_KEYS.BRM_MANUTENCAO, defaults, storage), defaults);
});

test('clearDraft and clearAllDrafts remove persisted drafts cleanly', () => {
  const storage = createMemoryStorage();
  saveDraft(DRAFT_KEYS.ARM_GRC, { chamado: 'RITM1' }, storage);
  saveDraft(DRAFT_KEYS.BRM_MANUTENCAO, { numeroChamado: 'TASK2' }, storage);
  saveDraft(DRAFT_KEYS.LOGS_GERAIS, { greetingMode: 'noite' }, storage);

  clearDraft(DRAFT_KEYS.ARM_GRC, storage);
  assert.equal(storage.getItem(DRAFT_KEYS.ARM_GRC), null);
  assert.notEqual(storage.getItem(DRAFT_KEYS.BRM_MANUTENCAO), null);

  clearAllDrafts(storage);
  assert.equal(storage.getItem(DRAFT_KEYS.BRM_MANUTENCAO), null);
  assert.equal(storage.getItem(DRAFT_KEYS.LOGS_GERAIS), null);
});
