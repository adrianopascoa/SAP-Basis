import { CustomGeneralLogTemplate, ImportantLinkItem, LogHistoryEntry } from '../types/sapLogs';

const MAX_HISTORY_ENTRIES = 40;
const MAX_FAVORITE_IDS = 200;
const MAX_CUSTOM_TEMPLATES = 100;
const MAX_CUSTOM_LINKS = 100;
const VALID_AREAS = new Set(['ARM', 'BRM', 'GERAIS']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeHttpUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parseStoredHistory(raw: string | null): LogHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid: LogHistoryEntry[] = [];
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      if (
        typeof item.id !== 'string' ||
        !item.id.trim() ||
        typeof item.createdAt !== 'string' ||
        typeof item.area !== 'string' ||
        !VALID_AREAS.has(item.area) ||
        typeof item.moduleLabel !== 'string' ||
        typeof item.actionLabel !== 'string' ||
        typeof item.chamado !== 'string' ||
        typeof item.solicitante !== 'string' ||
        typeof item.content !== 'string'
      ) {
        continue;
      }

      valid.push({
        id: item.id,
        createdAt: item.createdAt,
        area: item.area as LogHistoryEntry['area'],
        moduleLabel: item.moduleLabel,
        actionLabel: item.actionLabel,
        chamado: item.chamado,
        solicitante: item.solicitante,
        content: item.content,
      });

      if (valid.length >= MAX_HISTORY_ENTRIES) break;
    }

    return valid;
  } catch {
    return [];
  }
}

export function parseStoredStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const valid: string[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string' || !item.trim() || seen.has(item)) continue;
      seen.add(item);
      valid.push(item);
      if (valid.length >= MAX_FAVORITE_IDS) break;
    }
    return valid;
  } catch {
    return [];
  }
}

export function parseStoredCustomTemplates(raw: string | null): CustomGeneralLogTemplate[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid: CustomGeneralLogTemplate[] = [];
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      if (
        typeof item.id !== 'string' ||
        !item.id.trim() ||
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        typeof item.bodyTemplate !== 'string'
      ) {
        continue;
      }

      valid.push({
        id: item.id,
        title: item.title,
        description: typeof item.description === 'string' ? item.description : '',
        hasGreeting: typeof item.hasGreeting === 'boolean' ? item.hasGreeting : true,
        bodyTemplate: item.bodyTemplate,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      });

      if (valid.length >= MAX_CUSTOM_TEMPLATES) break;
    }

    return valid;
  } catch {
    return [];
  }
}

export function parseStoredImportantLinks(raw: string | null): ImportantLinkItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid: ImportantLinkItem[] = [];
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      if (
        typeof item.id !== 'string' ||
        !item.id.trim() ||
        typeof item.label !== 'string' ||
        !item.label.trim() ||
        typeof item.url !== 'string'
      ) {
        continue;
      }

      const safeUrl = sanitizeHttpUrl(item.url);
      if (!safeUrl) continue;

      valid.push({
        id: item.id,
        label: item.label.trim(),
        url: safeUrl,
        isCustom: true,
      });

      if (valid.length >= MAX_CUSTOM_LINKS) break;
    }

    return valid;
  } catch {
    return [];
  }
}
