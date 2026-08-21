import {
  formatServiceAttributeValue,
  getServiceFormProfile,
  type ServiceCategoryAttributes,
} from '@/lib/services/service-form-profiles';

export type ServiceListingChip = {
  key: string;
  label: string;
  value: string;
};

export function getServiceListingAttributeChips(input: {
  categorySlug?: string | null;
  parentSlug?: string | null;
  attributes?: ServiceCategoryAttributes | null;
  max?: number;
}): ServiceListingChip[] {
  const max = input.max ?? 3;
  const attrs = input.attributes;
  if (!attrs || Object.keys(attrs).length === 0) return [];
  const profile = getServiceFormProfile(input.parentSlug, input.categorySlug);
  if (!profile) return [];

  const chips: ServiceListingChip[] = [];
  const seen = new Set<string>();

  const pushField = (key: string) => {
    if (chips.length >= max || seen.has(key)) return;
    const field = profile.fields.find(f => f.key === key);
    if (!field) return;
    const value = formatServiceAttributeValue(field, attrs[field.key]);
    if (!value) return;
    seen.add(key);
    chips.push({ key: field.key, label: field.label, value });
  };

  for (const field of profile.fields) {
    if (field.required) pushField(field.key);
  }
  for (const field of profile.fields) {
    pushField(field.key);
  }

  return chips;
}
