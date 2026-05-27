/** Champs sensibles — ne jamais persister côté client (customization JSON). */
const SECRET_FIELD_PATTERN =
  /^(api[_-]?key|api[_-]?secret|password|secret|dsn|access[_-]?key|token|private[_-]?key)$/i;

export function isIntegrationSecretField(field: string): boolean {
  return SECRET_FIELD_PATTERN.test(field);
}

export function stripIntegrationSecrets<T extends Record<string, unknown>>(config: T): T {
  const out = { ...config };
  for (const [field, value] of Object.entries(out)) {
    if (isIntegrationSecretField(field)) {
      delete out[field];
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[field as keyof T] = stripIntegrationSecrets(
        value as Record<string, unknown>
      ) as T[keyof T];
    }
  }
  return out;
}

export function stripIntegrationsTree(
  integrations: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [category, value] of Object.entries(integrations)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[category] = stripIntegrationSecrets(value as Record<string, unknown>);
    } else {
      result[category] = value;
    }
  }
  return result;
}
