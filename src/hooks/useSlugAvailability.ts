import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Configuration pour la vérification du slug
 */
const SLUG_CHECK_DEBOUNCE_MS = 500;
const MIN_SLUG_LENGTH = 3;

/**
 * Hook personnalisé pour gérer la vérification de disponibilité du slug
 * 
 * Gère:
 * - Vérification asynchrone de disponibilité
 * - Debouncing pour limiter les appels API
 * - États de chargement
 * - Gestion d'erreurs avec Sentry
 * 
 * @param slug - Le slug à vérifier
 * @param checkSlugAvailability - Fonction asynchrone pour vérifier la disponibilité
 * @returns Objet contenant l'état de disponibilité et de chargement
 * 
 * @example
 * ```tsx
 * const { slugAvailable, checkingSlug } = useSlugAvailability(
 *   formData.slug,
 *   checkSlugAvailability
 * );
 * 
 * // Dans le render:
 * {checkingSlug && <Spinner />}
 * {slugAvailable === true && <CheckIcon />}
 * {slugAvailable === false && <XIcon />}
 * ```
 */
export const useSlugAvailability = (
  slug: string,
  checkSlugAvailability: (slug: string) => Promise<boolean>
) => {
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    // Fonction asynchrone pour vérifier le slug
    const checkSlug = async () => {
      // Vérifier uniquement si le slug est assez long
      if (slug && slug.length > MIN_SLUG_LENGTH) {
        setCheckingSlug(true);
        try {
          const available = await checkSlugAvailability(slug);
          setSlugAvailable(available);
        } catch (error) {
          Sentry.captureException(error, {
            tags: { action: 'slug_verification', hook: 'useSlugAvailability' },
            extra: { slug },
          });
          setSlugAvailable(null);
        } finally {
          setCheckingSlug(false);
        }
      } else {
        // Réinitialiser l'état si le slug est trop court
        setSlugAvailable(null);
        setCheckingSlug(false);
      }
    };

    // Debouncing: attendre SLUG_CHECK_DEBOUNCE_MS avant de vérifier
    const timeout = setTimeout(checkSlug, SLUG_CHECK_DEBOUNCE_MS);

    // Cleanup: annuler le timeout si le composant unmount ou si le slug change
    return () => clearTimeout(timeout);
  }, [slug, checkSlugAvailability]);

  return {
    slugAvailable,
    checkingSlug,
  };
};

/**
 * Hook pour gérer la génération automatique de slug à partir du nom
 * 
 * @param name - Nom du produit
 * @param currentSlug - Slug actuel
 * @param generateSlug - Fonction pour générer un slug depuis un nom
 * @param updateSlug - Fonction pour mettre à jour le slug
 * 
 * @example
 * ```tsx
 * useSlugGeneration(
 *   formData.name,
 *   formData.slug,
 *   generateSlug,
 *   (newSlug) => updateFormData('slug', newSlug)
 * );
 * ```
 */
export const useSlugGeneration = (
  name: string,
  currentSlug: string,
  generateSlug: (name: string) => string,
  updateSlug: (slug: string) => void,
  autoGenerate: boolean = true
) => {
  useEffect(() => {
    if (autoGenerate && name) {
      // Générer le slug uniquement si pas de slug ou si le slug correspond à l'ancien nom
      const expectedSlug = generateSlug(name);
      if (!currentSlug || currentSlug === generateSlug(name)) {
        updateSlug(expectedSlug);
      }
    }
  }, [name, currentSlug, generateSlug, updateSlug, autoGenerate]);
};

