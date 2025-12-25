/**
 * 🔒 ARTIST PRODUCT SANITIZER - Phase 1 Sécurité
 * Date: 31 Janvier 2025
 *
 * Sanitization complète de tous les champs texte du formulaire "Oeuvre d'artiste"
 * Prévention XSS et injection de code malveillant
 */

import { sanitizeProductDescription } from './html-sanitizer';
import { sanitizeString as sanitizeStringBasic } from './security/securityUtils';
import { validateURL, validateSocialURLs } from './validation-utils';
import type { ArtistProductFormData } from '@/types/artist-product';

/**
 * Sanitize tous les champs texte d'un formulaire artiste
 *
 * @param formData - Données du formulaire à sanitizer
 * @returns Données sanitizées
 */
export function sanitizeArtistProductFormData(
  formData: Partial<ArtistProductFormData>
): Partial<ArtistProductFormData> {
  const sanitized: Partial<ArtistProductFormData> = { ...formData };

  // 1. Nom de l'artiste (texte simple)
  if (sanitized.artist_name) {
    sanitized.artist_name = sanitizeStringBasic(sanitized.artist_name).substring(0, 100);
  }

  // 2. Biographie de l'artiste (texte simple, peut contenir HTML basique)
  if (sanitized.artist_bio) {
    // Sanitizer HTML basique (supprime scripts, garde formatage)
    sanitized.artist_bio = sanitizeStringBasic(sanitized.artist_bio).substring(0, 2000);
  }

  // 3. Site web de l'artiste (URL)
  if (sanitized.artist_website) {
    const urlResult = validateURL(sanitized.artist_website);
    if (urlResult.valid && urlResult.sanitized) {
      sanitized.artist_website = urlResult.sanitized;
    } else {
      // URL invalide - vider le champ
      sanitized.artist_website = '';
    }
  }

  // 4. Réseaux sociaux (URLs)
  if (sanitized.artist_social_links) {
    const socialLinks = { ...sanitized.artist_social_links };
    const socialResult = validateSocialURLs({
      facebook: socialLinks.facebook,
      instagram: socialLinks.instagram,
      twitter: socialLinks.twitter,
      youtube: socialLinks.youtube,
    });

    // Sanitizer chaque URL valide
    if (socialLinks.instagram) {
      const instaResult = validateURL(socialLinks.instagram, {
        allowedDomains: ['instagram.com'],
      });
      socialLinks.instagram =
        instaResult.valid && instaResult.sanitized ? instaResult.sanitized : '';
    }

    if (socialLinks.facebook) {
      const fbResult = validateURL(socialLinks.facebook, {
        allowedDomains: ['facebook.com', 'fb.com'],
      });
      socialLinks.facebook = fbResult.valid && fbResult.sanitized ? fbResult.sanitized : '';
    }

    if (socialLinks.twitter) {
      const twResult = validateURL(socialLinks.twitter, {
        allowedDomains: ['twitter.com', 'x.com'],
      });
      socialLinks.twitter = twResult.valid && twResult.sanitized ? twResult.sanitized : '';
    }

    if (socialLinks.youtube) {
      const ytResult = validateURL(socialLinks.youtube, {
        allowedDomains: ['youtube.com', 'youtu.be'],
      });
      socialLinks.youtube = ytResult.valid && ytResult.sanitized ? ytResult.sanitized : '';
    }

    sanitized.artist_social_links = socialLinks;
  }

  // 5. Titre de l'œuvre (texte simple)
  if (sanitized.artwork_title) {
    sanitized.artwork_title = sanitizeStringBasic(sanitized.artwork_title).substring(0, 200);
  }

  // 6. Médium (texte simple)
  if (sanitized.artwork_medium) {
    sanitized.artwork_medium = sanitizeStringBasic(sanitized.artwork_medium).substring(0, 100);
  }

  // 7. Lien vers l'œuvre (URL)
  if (sanitized.artwork_link_url) {
    const urlResult = validateURL(sanitized.artwork_link_url);
    if (urlResult.valid && urlResult.sanitized) {
      sanitized.artwork_link_url = urlResult.sanitized;
    } else {
      sanitized.artwork_link_url = undefined;
    }
  }

  // 8. Description complète (HTML - CRITIQUE XSS)
  if (sanitized.description) {
    // Utiliser DOMPurify pour sanitizer le HTML
    sanitized.description = sanitizeProductDescription(sanitized.description);
    // Limiter la longueur (10000 caractères max)
    if (sanitized.description.length > 10000) {
      sanitized.description = sanitized.description.substring(0, 10000);
    }
  }

  // 9. Description courte (texte simple)
  if (sanitized.short_description) {
    sanitized.short_description = sanitizeStringBasic(sanitized.short_description).substring(
      0,
      160
    );
  }

  // 10. Emplacement signature (texte simple)
  if (sanitized.signature_location) {
    sanitized.signature_location = sanitizeStringBasic(sanitized.signature_location).substring(
      0,
      200
    );
  }

  // 11. Spécificités par type d'artiste
  if (sanitized.writer_specific) {
    const writer = { ...sanitized.writer_specific };

    if (writer.book_isbn) {
      // Sanitizer ISBN (enlever caractères non alphanumériques sauf tirets)
      writer.book_isbn = sanitizeStringBasic(writer.book_isbn)
        .replace(/[^0-9-]/g, '')
        .substring(0, 20);
    }

    if (writer.book_language) {
      writer.book_language = sanitizeStringBasic(writer.book_language).substring(0, 50);
    }

    if (writer.book_genre) {
      writer.book_genre = sanitizeStringBasic(writer.book_genre).substring(0, 100);
    }

    if (writer.book_publisher) {
      writer.book_publisher = sanitizeStringBasic(writer.book_publisher).substring(0, 200);
    }

    sanitized.writer_specific = writer;
  }

  if (sanitized.musician_specific) {
    const musician = { ...sanitized.musician_specific };

    if (musician.album_genre) {
      musician.album_genre = sanitizeStringBasic(musician.album_genre).substring(0, 100);
    }

    if (musician.album_label) {
      musician.album_label = sanitizeStringBasic(musician.album_label).substring(0, 200);
    }

    // Sanitizer les pistes
    if (musician.album_tracks && Array.isArray(musician.album_tracks)) {
      musician.album_tracks = musician.album_tracks.map(track => ({
        ...track,
        title: track.title ? sanitizeStringBasic(track.title).substring(0, 200) : '',
        artist: track.artist ? sanitizeStringBasic(track.artist).substring(0, 100) : '',
        duration:
          typeof track.duration === 'number' && track.duration >= 0 && track.duration <= 3600
            ? track.duration
            : 0,
      }));
    }

    sanitized.musician_specific = musician;
  }

  if (sanitized.visual_artist_specific) {
    const visual = { ...sanitized.visual_artist_specific };

    if (visual.artwork_style) {
      visual.artwork_style = sanitizeStringBasic(visual.artwork_style).substring(0, 100);
    }

    if (visual.artwork_subject) {
      visual.artwork_subject = sanitizeStringBasic(visual.artwork_subject).substring(0, 100);
    }

    sanitized.visual_artist_specific = visual;
  }

  if (sanitized.designer_specific) {
    const designer = { ...sanitized.designer_specific };

    if (designer.design_category) {
      designer.design_category = sanitizeStringBasic(designer.design_category).substring(0, 100);
    }

    sanitized.designer_specific = designer;
  }

  // 12. SEO
  if (sanitized.seo) {
    const seo = { ...sanitized.seo };

    if (seo.meta_title) {
      seo.meta_title = sanitizeStringBasic(seo.meta_title).substring(0, 70);
    }

    if (seo.meta_description) {
      seo.meta_description = sanitizeStringBasic(seo.meta_description).substring(0, 200);
    }

    if (seo.meta_keywords) {
      seo.meta_keywords = sanitizeStringBasic(seo.meta_keywords).substring(0, 500);
    }

    if (seo.og_title) {
      seo.og_title = sanitizeStringBasic(seo.og_title).substring(0, 100);
    }

    if (seo.og_description) {
      seo.og_description = sanitizeStringBasic(seo.og_description).substring(0, 300);
    }

    if (seo.og_image) {
      const urlResult = validateURL(seo.og_image);
      seo.og_image = urlResult.valid && urlResult.sanitized ? urlResult.sanitized : '';
    }

    sanitized.seo = seo;
  }

  // 13. FAQs
  if (sanitized.faqs && Array.isArray(sanitized.faqs)) {
    sanitized.faqs = sanitized.faqs.map(faq => ({
      ...faq,
      question: faq.question ? sanitizeStringBasic(faq.question).substring(0, 300) : '',
      answer: faq.answer ? sanitizeStringBasic(faq.answer).substring(0, 2000) : '',
    }));
  }

  return sanitized;
}

/**
 * Valide et sanitize les données avant sauvegarde
 *
 * @param formData - Données du formulaire
 * @returns Données sanitizées et validées
 * @throws Error si validation échoue
 */
export function validateAndSanitizeArtistProduct(
  formData: Partial<ArtistProductFormData>
): Partial<ArtistProductFormData> {
  // 1. Sanitizer d'abord
  const sanitized = sanitizeArtistProductFormData(formData);

  // 2. Validations de base
  if (!sanitized.artwork_title || sanitized.artwork_title.trim().length < 2) {
    throw new Error("Le titre de l'œuvre est requis (minimum 2 caractères)");
  }

  if (!sanitized.artist_name || sanitized.artist_name.trim().length < 2) {
    throw new Error("Le nom de l'artiste est requis (minimum 2 caractères)");
  }

  if (!sanitized.artwork_medium || sanitized.artwork_medium.trim().length === 0) {
    throw new Error('Le médium est requis');
  }

  if (!sanitized.description || sanitized.description.trim().length < 10) {
    throw new Error('La description est requise (minimum 10 caractères)');
  }

  if (!sanitized.price || sanitized.price <= 0) {
    throw new Error('Le prix doit être supérieur à 0');
  }

  if (sanitized.price > 999999999.99) {
    throw new Error('Le prix ne peut pas dépasser 999,999,999.99');
  }

  // Validation prix de comparaison
  if (sanitized.compare_at_price !== null && sanitized.compare_at_price !== undefined) {
    if (sanitized.compare_at_price < sanitized.price) {
      throw new Error('Le prix de comparaison doit être supérieur ou égal au prix');
    }
  }

  // Validation édition limitée
  if (sanitized.edition_type === 'limited_edition') {
    if (!sanitized.edition_number || !sanitized.total_editions) {
      throw new Error("Pour une édition limitée, le numéro d'édition et le total sont requis");
    }
    if (sanitized.edition_number > sanitized.total_editions) {
      throw new Error("Le numéro d'édition ne peut pas être supérieur au total");
    }
  }

  // Validation cohérence shipping
  if (!sanitized.requires_shipping && !sanitized.artwork_link_url) {
    throw new Error("Pour une œuvre non physique, un lien vers l'œuvre est requis");
  }

  return sanitized;
}
