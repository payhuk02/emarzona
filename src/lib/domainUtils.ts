/**
 * Utilitaires pour la gestion des domaines personnalisés
 */

/**
 * Valide un nom de domaine
 * @param domain - Le nom de domaine à valider
 * @returns true si le domaine est valide, false sinon
 * 
 * @example
 * validateDomain('example.com') // true
 * validateDomain('mon-site.fr') // true
 * validateDomain('invalid') // false
 * validateDomain('-example.com') // false
 */
export const validateDomain = (domain: string): boolean => {
  if (!domain || domain.trim().length === 0) {
    return false;
  }

  // Regex pour valider un nom de domaine
  // - Commence et finit par un caractère alphanumérique
  // - Peut contenir des tirets au milieu
  // - Doit avoir une extension valide (.com, .fr, .co.uk, etc.)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
  
  return domainRegex.test(domain);
};

/**
 * Génère un token de vérification unique pour un domaine
 * @returns Un token unique au format "payhula-verify-{random}"
 * 
 * @example
 * generateVerificationToken() // "payhula-verify-abc123def456"
 */
export const generateVerificationToken = (): string => {
  const randomString = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  return `payhula-verify-${randomString}`;
};

/**
 * Retourne les instructions DNS pour un domaine
 * @param domain - Le nom de domaine
 * @param token - Le token de vérification
 * @returns Les instructions DNS complètes
 */
export const getDNSInstructions = (domain: string, token: string) => {
  return {
    aRecord: {
      type: 'A' as const,
      name: domain,
      value: '185.158.133.1',
      ttl: 3600,
      description: 'Enregistrement A principal pour le domaine'
    },
    wwwRecord: {
      type: 'A' as const,
      name: `www.${domain}`,
      value: '185.158.133.1',
      ttl: 3600,
      description: 'Enregistrement A pour le sous-domaine www'
    },
    txtRecord: {
      type: 'TXT' as const,
      name: `_payhula-verification.${domain}`,
      value: token,
      ttl: 3600,
      description: 'Enregistrement TXT de vérification Payhula'
    }
  };
};

/**
 * Vérifie la propagation DNS d'un domaine via Google DNS API
 * @param domain - Le nom de domaine à vérifier
 * @param verificationToken - Le token de vérification attendu
 * @returns Les résultats de la vérification DNS
 */
export const checkDNSPropagation = async (
  domain: string,
  verificationToken: string
) => {
  const startTime = Date.now();
  const errors: string[] = [];
  const details = {
    aRecord: false,
    wwwRecord: false,
    txtRecord: false,
    cnameRecord: false
  };

  try {
    // Vérifier enregistrement A principal
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = await aResponse.json();
      
      if (aData.Answer && aData.Answer.length > 0) {
        const targetIP = '185.158.133.1';
        details.aRecord = aData.Answer.some((answer: any) => answer.data === targetIP);
        if (!details.aRecord) {
          errors.push(`Enregistrement A incorrect: pointe vers ${aData.Answer[0].data} au lieu de ${targetIP}`);
        }
      } else {
        errors.push("Enregistrement A manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement A");
    }

    // Vérifier enregistrement A www
    try {
      const wwwResponse = await fetch(`https://dns.google/resolve?name=www.${domain}&type=A`);
      const wwwData = await wwwResponse.json();
      
      if (wwwData.Answer && wwwData.Answer.length > 0) {
        const targetIP = '185.158.133.1';
        details.wwwRecord = wwwData.Answer.some((answer: any) => answer.data === targetIP);
        if (!details.wwwRecord) {
          errors.push(`Enregistrement WWW incorrect: pointe vers ${wwwData.Answer[0].data} au lieu de ${targetIP}`);
        }
      } else {
        errors.push("Enregistrement WWW manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement WWW");
    }

    // Vérifier enregistrement TXT de vérification
    try {
      const txtResponse = await fetch(`https://dns.google/resolve?name=_payhula-verification.${domain}&type=TXT`);
      const txtData = await txtResponse.json();
      
      if (txtData.Answer && txtData.Answer.length > 0) {
        details.txtRecord = txtData.Answer.some((answer: any) => 
          answer.data && answer.data.replace(/"/g, '') === verificationToken
        );
        if (!details.txtRecord) {
          errors.push("Token de vérification TXT incorrect ou manquant");
        }
      } else {
        errors.push("Enregistrement TXT de vérification manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement TXT");
    }

    // CNAME n'est généralement pas utilisé avec des domaines apex
    details.cnameRecord = true;

    const isPropagated = details.aRecord && details.wwwRecord && details.txtRecord;
    const propagationTime = Date.now() - startTime;
    
    return {
      isPropagated,
      details,
      errors,
      propagationTime,
      lastCheck: new Date()
    };
  } catch (error) {
    console.error('Error checking DNS propagation:', error);
    return {
      isPropagated: false,
      details: {
        aRecord: false,
        wwwRecord: false,
        txtRecord: false,
        cnameRecord: false
      },
      errors: ["Erreur générale lors de la vérification DNS"],
      propagationTime: 0,
      lastCheck: new Date()
    };
  }
};

/**
 * Formatte la durée de propagation DNS de manière lisible
 * @param milliseconds - Durée en millisecondes
 * @returns Durée formatée (ex: "2 minutes 30 secondes")
 */
export const formatPropagationTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}`;
  }
  
  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
};

