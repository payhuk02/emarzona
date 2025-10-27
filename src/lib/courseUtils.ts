/**
 * Utilitaires pour les cours
 * Date : 27 octobre 2025
 * Amélioration : Code DRY et réutilisable
 */

/**
 * Formate une durée en secondes en format lisible
 * @param seconds - Durée en secondes
 * @param format - Format de sortie ('short' | 'long' | 'hms')
 * @returns Chaîne formatée
 */
export const formatDuration = (
  seconds: number | undefined,
  format: 'short' | 'long' | 'hms' = 'short'
): string => {
  if (!seconds || seconds === 0) return '—';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  switch (format) {
    case 'short':
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      }
      return `${secs}s`;

    case 'long':
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
      return parts.join(', ');

    case 'hms':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    default:
      return `${seconds}s`;
  }
};

/**
 * Formate une durée en minutes en format lisible
 * @param minutes - Durée en minutes
 * @returns Chaîne formatée (ex: "2h 30m")
 */
export const formatMinutes = (minutes: number | undefined): string => {
  if (!minutes || minutes === 0) return '—';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

/**
 * Calcule le pourcentage de progression
 * @param completed - Nombre d'éléments complétés
 * @param total - Nombre total d'éléments
 * @returns Pourcentage arrondi
 */
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Détermine le niveau de difficulté
 * @param level - Niveau du cours
 * @returns Label et couleur
 */
export const getLevelInfo = (level: string): { label: string; color: string } => {
  const levels: Record<string, { label: string; color: string }> = {
    beginner: { label: 'Débutant', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Intermédiaire', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Avancé', color: 'bg-purple-100 text-purple-800' },
    expert: { label: 'Expert', color: 'bg-red-100 text-red-800' },
  };

  return levels[level.toLowerCase()] || { label: level, color: 'bg-gray-100 text-gray-800' };
};

/**
 * Formate un numéro de certificat pour l'affichage
 * @param certificateNumber - Numéro complet du certificat
 * @returns Numéro formaté avec espaces
 */
export const formatCertificateNumber = (certificateNumber: string): string => {
  // Ex: CERT-1730123456-ABC123 -> CERT 1730 1234 56 ABC123
  return certificateNumber.replace(/^(CERT)-(\d+)-(\w+)$/, '$1 $2 $3');
};

/**
 * Génère un slug à partir d'un titre
 * @param title - Titre à convertir
 * @returns Slug formaté
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .replace(/^-+|-+$/g, ''); // Supprimer tirets début/fin
};

/**
 * Valide un slug
 * @param slug - Slug à valider
 * @returns true si valide
 */
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
};

/**
 * Messages d'encouragement selon la progression
 * @param percentage - Pourcentage de progression
 * @returns Message personnalisé
 */
export const getProgressMessage = (percentage: number): string => {
  if (percentage === 0) return "Commencez votre apprentissage !";
  if (percentage < 25) return "Vous venez de commencer, continuez comme ça !";
  if (percentage < 50) return "Bon début ! Vous êtes sur la bonne voie.";
  if (percentage < 75) return "Plus de la moitié ! Vous y êtes presque.";
  if (percentage < 100) return "Dernière ligne droite ! Ne lâchez rien.";
  return "Cours terminé ! 🎉";
};

/**
 * Détermine si un cours peut générer un certificat
 * @param completedLessons - Nombre de leçons complétées
 * @param totalLessons - Nombre total de leçons
 * @param certificateEnabled - Si le certificat est activé
 * @returns true si certificat disponible
 */
export const canGenerateCertificate = (
  completedLessons: number,
  totalLessons: number,
  certificateEnabled: boolean
): boolean => {
  return certificateEnabled && completedLessons === totalLessons && totalLessons > 0;
};

/**
 * Formate une date en français
 * @param date - Date à formater
 * @param format - Format de sortie
 * @returns Date formatée
 */
export const formatCourseDate = (
  date: string | Date,
  format: 'short' | 'long' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('fr-FR');
  }
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

