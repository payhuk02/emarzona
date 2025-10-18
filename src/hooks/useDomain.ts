import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Store } from "./useStore";

export const useDomain = (store: Store | null) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const generateVerificationToken = () => {
    return `verify-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  const connectDomain = async (domain: string) => {
    if (!store) return false;

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
          custom_domain: domain,
          domain_status: 'pending',
          domain_verification_token: verificationToken,
          domain_error_message: null
        })
        .eq('id', store.id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Domaine déjà utilisé",
            description: "Ce domaine est déjà connecté à une autre boutique.",
            variant: "destructive"
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Domaine configuré",
        description: "Suivez les instructions DNS pour finaliser la connexion."
      });

      return true;
    } catch (error: any) {
      console.error('Error connecting domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de configurer le domaine.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyDomain = async () => {
    if (!store?.custom_domain) return false;

    setVerifying(true);
    try {
      // Simulated DNS verification
      // In production, this would call a backend function to verify DNS records
      const isVerified = await simulateDNSVerification(store.custom_domain);

      if (isVerified) {
        const { error } = await supabase
          .from('stores')
          .update({
            domain_status: 'verified',
            domain_verified_at: new Date().toISOString(),
            domain_error_message: null
          })
          .eq('id', store.id);

        if (error) throw error;

        toast({
          title: "✅ Domaine vérifié !",
          description: "Votre domaine est maintenant actif avec HTTPS."
        });

        return true;
      } else {
        const { error } = await supabase
          .from('stores')
          .update({
            domain_status: 'error',
            domain_error_message: 'Les enregistrements DNS ne sont pas correctement configurés. Veuillez vérifier vos paramètres DNS.'
          })
          .eq('id', store.id);

        if (error) throw error;

        toast({
          title: "Vérification échouée",
          description: "Les enregistrements DNS ne sont pas encore configurés correctement.",
          variant: "destructive"
        });

        return false;
      }
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le domaine.",
        variant: "destructive"
      });
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const disconnectDomain = async () => {
    if (!store) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          custom_domain: null,
          domain_status: 'not_configured',
          domain_verification_token: null,
          domain_verified_at: null,
          domain_error_message: null
        })
        .eq('id', store.id);

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
  };

  // Simulated DNS verification (in production, use a backend function)
  const simulateDNSVerification = async (domain: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, randomly return true/false
    // In production, this would check actual DNS records
    return Math.random() > 0.3; // 70% success rate for demo
  };

  const getDNSInstructions = () => {
    if (!store?.custom_domain) return null;

    return {
      aRecord: {
        type: "A",
        name: "@",
        value: "185.158.133.1",
        ttl: "3600"
      },
      wwwRecord: {
        type: "A",
        name: "www",
        value: "185.158.133.1",
        ttl: "3600"
      },
      verificationRecord: {
        type: "TXT",
        name: "_lovable-verification",
        value: store.domain_verification_token || "",
        ttl: "3600"
      }
    };
  };

  return {
    loading,
    verifying,
    connectDomain,
    verifyDomain,
    disconnectDomain,
    getDNSInstructions
  };
};
