export const DRAFT_KEYS = {
  ARM_GRC: 'sap_basis_draft_arm_grc_v1',
  ARM_LEGADOS: 'sap_basis_draft_arm_legados_v1',
  ARM_MULTIPLO: 'sap_basis_draft_arm_multiplo_v1',
  BRM_MANUTENCAO: 'sap_basis_draft_brm_manutencao_v1',
  BRM_LEGADOS: 'sap_basis_draft_brm_legados_v1',
  ENCERRAMENTO_ARM: 'sap_basis_draft_encerramento_arm_v1',
  ENCERRAMENTO_BRM: 'sap_basis_draft_encerramento_brm_v1',
  LOGS_GERAIS: 'sap_basis_draft_logs_gerais_v1',
} as const;

export function loadDraft<T extends object>(
  key: string,
  fallback: T,
  storage: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined'
    ? window.sessionStorage
    : null
): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }
    return { ...fallback, ...(parsed as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function saveDraft<T>(
  key: string,
  data: T,
  storage: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined'
    ? window.sessionStorage
    : null
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function clearDraft(
  key: string,
  storage: Pick<Storage, 'removeItem'> | null = typeof window !== 'undefined'
    ? window.sessionStorage
    : null
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export function clearAllDrafts(
  storage: Pick<Storage, 'removeItem'> | null = typeof window !== 'undefined'
    ? window.sessionStorage
    : null
): void {
  if (!storage) return;
  Object.values(DRAFT_KEYS).forEach((key) => {
    clearDraft(key, storage);
  });
}
