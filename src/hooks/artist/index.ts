/**
 * Artist Products Hooks - Exports
 * Date: 28 Février 2025
 * Updated: Audit P1 - Export complet
 */

export {
  useArtistProducts,
  useArtistProduct,
  useArtistProductById,
  useCreateArtistProduct,
  useUpdateArtistProduct,
  useDeleteArtistProduct,
  useArtistProductsByType,
  usePopularArtistProducts,
  type ArtistProductWithStats,
} from './useArtistProducts';

// Auctions
export * from './useArtistAuctions';

// Certificates
export * from './useArtistCertificates';

// Dedications
export * from './useArtistDedications';

// Portfolios
export * from './useArtistPortfolios';

// Shipping
export * from './useArtistShipping';

// Artwork Provenance
export * from './useArtworkProvenance';

// Collections
export * from './useCollections';

// Edition Tracking
export * from './useEditionTracking';

// Portfolio Comments
export * from './usePortfolioComments';
