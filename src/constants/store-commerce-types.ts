export const STORE_COMMERCE_TYPES = ['physical', 'digital', 'service', 'course', 'artist'] as const;

export type StoreCommerceType = (typeof STORE_COMMERCE_TYPES)[number];

export const STORE_COMMERCE_TYPE_LABELS: Record<StoreCommerceType, string> = {
  physical: 'Produits physiques',
  digital: 'Produits digitaux',
  service: 'Services',
  course: 'Cours en ligne',
  artist: "Oeuvres d'artiste",
};
