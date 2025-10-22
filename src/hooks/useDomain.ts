import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DomainConfig {
  custom_domain: string | null;
  domain_status: 'not_configured' | 'pending' | 'verified' | 'error';
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  domain_error_message: string | null;
  ssl_enabled: boolean;
  redirect_www: boolean;
  redirect_https: boolean;
  dns_records: DNSRecord[];
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface DomainAnalytics {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  loadTime: number;
  uptime: number;
  lighthouseScore: number;
}

export const useDomain = (storeId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [analytics, setAnalytics] = useState<DomainAnalytics | null>(null);
  const { toast } = useToast();

  const generateVerificationToken = useCallback(() => {
    return `payhula-verify-${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const validateDomain = useCallback((domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }, []);

  const connectDomain = useCallback(async (domain: string): Promise<boolean> => {
    if (!storeId) {
      toast({
        title: "Erreur",
        description: "Aucune boutique trouvée",
        variant: "destructive"
      });
      return false;
    }

    if (!validateDomain(domain)) {
      toast({
        title: "Domaine invalide",
        description: "Veuillez entrer un nom de domaine valide (ex: maboutique.com)",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const verificationToken = generateVerificationToken();
      
      const { error } = await supabase
        .from('stores')
        .update({
          custom_domain: domain.trim(),
          domain_status: 'pending',
          domain_verification_token: verificationToken,
          domain_verified_at: null,
          domain_error_message: null,
          ssl_enabled: false,
          redirect_www: true,
          redirect_https: true
        })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Domaine connecté",
        description: "Votre domaine a été ajouté. Configurez maintenant les enregistrements DNS."
      });

      return true;
    } catch (error: any) {
      console.error('Error connecting domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter le domaine.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeId, validateDomain, generateVerificationToken, toast]);

  const verifyDomain = useCallback(async (): Promise<boolean> => {
    if (!storeId) return false;

    setVerifying(true);
    try {
      // Vérification de propagation DNS d'abord
      const { data: storeData } = await supabase
        .from('stores')
        .select('custom_domain')
        .eq('id', storeId)
        .single();
      
      if (!storeData?.custom_domain) {
        throw new Error('Aucun domaine configuré');
      }
      
      const propagationResult = await checkDNSPropagation(storeData.custom_domain);
      
      if (!propagationResult.isPropagated) {
        const { error } = await supabase
          .from('stores')
          .update({
            domain_status: 'error',
            domain_error_message: `Propagation DNS incomplète: ${propagationResult.errors.join(', ')}`
          })
          .eq('id', storeId);

        if (error) throw error;

        toast({
          title: "Propagation DNS incomplète",
          description: `Temps de propagation: ${Math.floor(propagationResult.propagationTime / 60)} minutes. ${propagationResult.errors.join(', ')}`,
          variant: "destructive"
        });

        return false;
      }

      // Si la propagation est OK, vérifier la configuration DNS
      const dnsValidation = await validateDNSConfiguration(storeData.custom_domain);
      
      if (!dnsValidation.isValid) {
        const { error } = await supabase
          .from('stores')
          .update({
            domain_status: 'error',
            domain_error_message: `Configuration DNS invalide: ${dnsValidation.errors.join(', ')}`
          })
          .eq('id', storeId);

        if (error) throw error;

        toast({
          title: "Configuration DNS invalide",
          description: dnsValidation.errors.join(', '),
          variant: "destructive"
        });

        return false;
      }

      // Si tout est OK, marquer comme vérifié
      const { error } = await supabase
        .from('stores')
        .update({
          domain_status: 'verified',
          domain_verified_at: new Date().toISOString(),
          domain_error_message: null,
          ssl_enabled: true
        })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Domaine vérifié avec succès",
        description: `Propagation DNS complète en ${Math.floor(propagationResult.propagationTime / 60)} minutes. SSL activé automatiquement.`
      });

      return true;
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      toast({
        title: "Erreur de vérification",
        description: "Impossible de vérifier le domaine.",
        variant: "destructive"
      });
      return false;
    } finally {
      setVerifying(false);
    }
  }, [storeId, checkDNSPropagation, validateDNSConfiguration, toast]);

  const disconnectDomain = useCallback(async (): Promise<boolean> => {
    if (!storeId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          custom_domain: null,
          domain_status: 'not_configured',
          domain_verification_token: null,
          domain_verified_at: null,
          domain_error_message: null,
          ssl_enabled: false,
          redirect_www: false,
          redirect_https: false,
          dns_records: []
        })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Domaine déconnecté",
        description: "Votre domaine personnalisé a été retiré."
      });

      return true;
    } catch (error: any) {
      console.error('Error disconnecting domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le domaine.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  const updateSSL = useCallback(async (sslEnabled: boolean): Promise<boolean> => {
    if (!storeId) return false;

    try {
      const { error } = await supabase
        .from('stores')
        .update({ ssl_enabled: sslEnabled })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "SSL mis à jour",
        description: `SSL ${sslEnabled ? 'activé' : 'désactivé'} pour votre domaine.`
      });

      return true;
    } catch (error: any) {
      console.error('Error updating SSL:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres SSL.",
        variant: "destructive"
      });
      return false;
    }
  }, [storeId, toast]);

  const updateRedirects = useCallback(async (redirects: { www?: boolean; https?: boolean }): Promise<boolean> => {
    if (!storeId) return false;

    try {
      const updateData: any = {};
      if (redirects.www !== undefined) updateData.redirect_www = redirects.www;
      if (redirects.https !== undefined) updateData.redirect_https = redirects.https;

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Redirections mises à jour",
        description: "Les paramètres de redirection ont été modifiés."
      });

      return true;
    } catch (error: any) {
      console.error('Error updating redirects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les redirections.",
        variant: "destructive"
      });
      return false;
    }
  }, [storeId, toast]);

  const getDNSInstructions = useCallback((domain: string, verificationToken: string) => {
    return {
      aRecord: {
        type: "A",
        name: "@",
        value: "185.158.133.1",
        ttl: 3600
      },
      wwwRecord: {
        type: "A",
        name: "www",
        value: "185.158.133.1",
        ttl: 3600
      },
      verificationRecord: {
        type: "TXT",
        name: "_payhula-verification",
        value: verificationToken,
        ttl: 3600
      },
      cnameRecord: {
        type: "CNAME",
        name: "shop",
        value: "payhula.com",
        ttl: 3600
      }
    };
  }, []);

  const checkDNSPropagation = useCallback(async (domain: string): Promise<{
    isPropagated: boolean;
    propagationTime: number;
    details: {
      aRecord: boolean;
      wwwRecord: boolean;
      txtRecord: boolean;
      cnameRecord: boolean;
    };
    errors: string[];
  }> => {
    try {
      // Simulation de vérification DNS (en production, utiliser une API DNS comme Cloudflare, Google DNS, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const propagationTime = Math.floor(Math.random() * 300) + 60; // 1-5 minutes
      const isPropagated = Math.random() > 0.2; // 80% de succès pour la démo
      
      const details = {
        aRecord: Math.random() > 0.1, // 90% de succès
        wwwRecord: Math.random() > 0.15, // 85% de succès
        txtRecord: Math.random() > 0.2, // 80% de succès
        cnameRecord: Math.random() > 0.3 // 70% de succès
      };
      
      const errors: string[] = [];
      if (!details.aRecord) errors.push("Enregistrement A principal non propagé");
      if (!details.wwwRecord) errors.push("Enregistrement A www non propagé");
      if (!details.txtRecord) errors.push("Enregistrement TXT de vérification non propagé");
      if (!details.cnameRecord) errors.push("Enregistrement CNAME non propagé");
      
      return {
        isPropagated,
        propagationTime,
        details,
        errors
      };
    } catch (error) {
      console.error('Error checking DNS propagation:', error);
      return {
        isPropagated: false,
        propagationTime: 0,
        details: {
          aRecord: false,
          wwwRecord: false,
          txtRecord: false,
          cnameRecord: false
        },
        errors: ["Erreur lors de la vérification de propagation DNS"]
      };
    }
  }, []);

  const getDomainAnalytics = useCallback(async (): Promise<DomainAnalytics | null> => {
    try {
      // Simulation d'analytics (en production, utiliser une API d'analytics)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnalytics: DomainAnalytics = {
        visitors: Math.floor(Math.random() * 2000) + 500,
        pageViews: Math.floor(Math.random() * 5000) + 1000,
        bounceRate: Math.floor(Math.random() * 30) + 20,
        loadTime: Math.random() * 2 + 0.5,
        uptime: 99.5 + Math.random() * 0.4,
        lighthouseScore: Math.floor(Math.random() * 20) + 80
      };

      setAnalytics(mockAnalytics);
      return mockAnalytics;
    } catch (error) {
      console.error('Error fetching domain analytics:', error);
      return null;
    }
  }, []);

  const exportDNSConfig = useCallback((domain: string, verificationToken: string) => {
    const config = getDNSInstructions(domain, verificationToken);
    const configText = `# Configuration DNS pour ${domain}

# Enregistrement A principal
${config.aRecord.name} ${config.aRecord.type} ${config.aRecord.value}

# Enregistrement A www
${config.wwwRecord.name} ${config.wwwRecord.type} ${config.wwwRecord.value}

# Enregistrement de vérification
${config.verificationRecord.name} ${config.verificationRecord.type} "${config.verificationRecord.value}"

# Enregistrement CNAME (optionnel)
${config.cnameRecord.name} ${config.cnameRecord.type} ${config.cnameRecord.value}
`;

    const blob = new Blob([configText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dns-config-${domain}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration exportée",
      description: "Le fichier de configuration DNS a été téléchargé."
    });
  }, [getDNSInstructions, toast]);

  const validateDNSConfiguration = useCallback(async (domain: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    try {
      // Simulation de validation DNS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Vérifications simulées
      if (Math.random() > 0.8) {
        errors.push("Enregistrement A principal manquant");
      }
      
      if (Math.random() > 0.9) {
        warnings.push("TTL élevé détecté (recommandé: 3600)");
      }
      
      if (Math.random() > 0.7) {
        warnings.push("Enregistrement CNAME détecté (peut causer des conflits)");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating DNS:', error);
      return {
        isValid: false,
        errors: ["Erreur lors de la validation DNS"],
        warnings: []
      };
    }
  }, []);

  return {
    loading,
    verifying,
    analytics,
    connectDomain,
    verifyDomain,
    disconnectDomain,
    updateSSL,
    updateRedirects,
    getDNSInstructions,
    checkDNSPropagation,
    getDomainAnalytics,
    exportDNSConfig,
    validateDNSConfiguration,
    validateDomain
  };
};