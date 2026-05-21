export interface MarketplaceFacetBucket {
  value: string;
  count: number;
}

export interface MarketplaceFacetsResponse {
  total: number;
  product_types: MarketplaceFacetBucket[];
  categories: MarketplaceFacetBucket[];
}
