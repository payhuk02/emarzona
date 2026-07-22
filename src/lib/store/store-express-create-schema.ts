/**
 * Schéma et payload pour la création express de boutique (Sprint 1).
 */

import { z } from 'zod';
import { STORE_COMMERCE_TYPES, type StoreCommerceType } from '@/constants/store-commerce-types';
import {
  assertReadyToCreateStore,
  normalizeStoreCreateInput,
} from '@/lib/store/create-store-service';
import { buildStoreCreateDefaults } from '@/lib/commerce/store-create-defaults';
import { applyThemeTemplate, getThemeTemplateById } from '@/lib/store-theme-templates';

export const storeExpressCreateSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la boutique est requis'),
  commerce_type: z.enum(STORE_COMMERCE_TYPES, {
    errorMap: () => ({ message: 'Le type de boutique est requis' }),
  }),
  themeTemplateId: z.string().optional(),
});

export type StoreExpressCreateInput = z.infer<typeof storeExpressCreateSchema>;

export interface CreateStoreOptions {
  themeTemplateId?: string;
  /** express = champs minimaux ; full = wizard avancé (défaut) */
  mode?: 'express' | 'full';
}

/** Champs client autorisés à la création (express ou wizard). */
export const CREATE_STORE_ALLOWED_CLIENT_KEYS = new Set([
  'name',
  'slug',
  'description',
  'default_currency',
  'commerce_type',
]);

export function parseStoreExpressCreateInput(raw: StoreExpressCreateInput) {
  return storeExpressCreateSchema.parse(raw);
}

export async function assertReadyForExpressCreate(raw: StoreExpressCreateInput) {
  const parsed = parseStoreExpressCreateInput(raw);
  const validated = await assertReadyToCreateStore({
    name: parsed.name,
    commerce_type: parsed.commerce_type,
  });
  return {
    validated,
    themeTemplateId: parsed.themeTemplateId,
    commerceType: parsed.commerce_type as StoreCommerceType,
  };
}

export type CreateStoreInsertPayload = Record<string, unknown>;

/**
 * Construit le payload d'insert sécurisé : defaults verticale → template → champs validés.
 * Les champs sensibles (user_id, is_active, commerce_type) sont toujours imposés côté serveur app.
 */
export function buildCreateStoreInsertPayload(params: {
  validated: Awaited<ReturnType<typeof assertReadyToCreateStore>>;
  commerceType: StoreCommerceType;
  userId: string;
  themeTemplateId?: string;
  writableFields?: Record<string, unknown>;
}): CreateStoreInsertPayload {
  const verticalDefaults = buildStoreCreateDefaults(params.commerceType);

  const templateId = params.themeTemplateId;
  const template = templateId ? getThemeTemplateById(templateId) : undefined;
  const themeDefaults = template ? applyThemeTemplate(template) : {};

  const forcedKeys = new Set([
    'name',
    'slug',
    'description',
    'default_currency',
    'commerce_type',
    'metadata',
    'user_id',
    'is_active',
  ]);

  const extras: Record<string, unknown> = {};
  if (params.writableFields) {
    for (const [key, value] of Object.entries(params.writableFields)) {
      if (!forcedKeys.has(key) && value !== undefined) {
        extras[key] = value;
      }
    }
  }

  return {
    ...verticalDefaults,
    ...themeDefaults,
    ...extras,
    name: params.validated.name,
    slug: params.validated.slug,
    description:
      (params.writableFields?.description as string | undefined) ??
      params.validated.description ??
      null,
    default_currency: params.validated.default_currency,
    commerce_type: params.commerceType,
    metadata: { commerce_type: params.commerceType },
    user_id: params.userId,
    is_active: true,
  };
}

/**
 * Colonnes minimales pour INSERT public.stores — évite PGRST204 404
 * quand PostgREST reçoit des extras (timezone, opening_hours, etc.) hors cache schéma.
 * Thème / apparence → store_appearance (extrait avant via extractAppearancePayload).
 */
export const MINIMAL_STORE_CREATE_INSERT_KEYS = [
  'user_id',
  'name',
  'slug',
  'description',
  'default_currency',
  'commerce_type',
  'metadata',
  'is_active',
] as const;

export function toMinimalStoreCreateInsert(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of MINIMAL_STORE_CREATE_INSERT_KEYS) {
    if (payload[key] !== undefined) {
      out[key] = payload[key];
    }
  }
  return out;
}

export function normalizeExpressSlugPreview(name: string): string {
  const parsed = storeExpressCreateSchema.safeParse({ name, commerce_type: 'physical' });
  if (!parsed.success) return '';
  return normalizeStoreCreateInput({
    name: parsed.data.name,
    commerce_type: 'physical',
  }).slug;
}
