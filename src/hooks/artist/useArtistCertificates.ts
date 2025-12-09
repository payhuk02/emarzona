/**
 * Hooks pour la gestion des certificats d'authenticité artistes
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { generateAndUploadCertificate } from '@/lib/artist-certificate-generator';
import type { ArtistCertificateData } from '@/lib/artist-certificate-generator';

export interface ArtistCertificate {
  id: string;
  order_id: string;
  order_item_id?: string;
  product_id: string;
  artist_product_id: string;
  user_id: string;
  certificate_number: string;
  certificate_type: 'authenticity' | 'limited_edition' | 'handmade';
  edition_number?: number;
  total_edition?: number;
  signed_by_artist: boolean;
  signed_date?: string;
  certificate_pdf_url?: string;
  certificate_image_url?: string;
  artwork_title: string;
  artist_name: string;
  artwork_medium?: string;
  artwork_year?: number;
  purchase_date: string;
  buyer_name: string;
  buyer_email?: string;
  is_generated: boolean;
  generated_at?: string;
  downloaded_at?: string;
  download_count: number;
  is_valid: boolean;
  revoked: boolean;
  revoked_at?: string;
  revoked_reason?: string;
  is_public: boolean;
  verification_code?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook pour récupérer un certificat par ID
 */
export const useArtistCertificate = (certificateId: string | undefined) => {
  return useQuery({
    queryKey: ['artist-certificate', certificateId],
    queryFn: async () => {
      if (!certificateId) return null;

      const { data, error } = await supabase
        .from('artist_product_certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (error) {
        logger.error('Error fetching certificate', { error, certificateId });
        throw error;
      }

      return data as ArtistCertificate;
    },
    enabled: !!certificateId,
  });
};

/**
 * Hook pour récupérer les certificats d'un utilisateur
 */
export const useUserArtistCertificates = (userId?: string) => {
  return useQuery({
    queryKey: ['artist-certificates', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('artist_product_certificates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user certificates', { error, userId });
        throw error;
      }

      return (data || []) as ArtistCertificate[];
    },
    enabled: !!userId,
  });
};

/**
 * Hook pour récupérer les certificats d'une commande
 */
export const useOrderArtistCertificates = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['artist-certificates-order', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('artist_product_certificates')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching order certificates', { error, orderId });
        throw error;
      }

      return (data || []) as ArtistCertificate[];
    },
    enabled: !!orderId,
  });
};

/**
 * Hook pour créer un certificat automatiquement après achat
 */
export const useCreateArtistCertificate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      orderItemId,
      productId,
      artistProductId,
      userId,
      certificateData,
    }: {
      orderId: string;
      orderItemId?: string;
      productId: string;
      artistProductId: string;
      userId: string;
      certificateData: ArtistCertificateData;
    }) => {
      try {
        // Générer et uploader le PDF
        const { pdfUrl } = await generateAndUploadCertificate(
          certificateData,
          orderId,
          productId
        );

        // Créer l'enregistrement dans la base de données
        const { data, error } = await supabase
          .from('artist_product_certificates')
          .insert({
            order_id: orderId,
            order_item_id: orderItemId,
            product_id: productId,
            artist_product_id: artistProductId,
            user_id: userId,
            certificate_number: certificateData.certificateNumber,
            certificate_type: certificateData.certificateType,
            edition_number: certificateData.editionNumber,
            total_edition: certificateData.totalEdition,
            signed_by_artist: certificateData.signedByArtist || false,
            signed_date: certificateData.signedDate,
            certificate_pdf_url: pdfUrl,
            artwork_title: certificateData.artworkTitle,
            artist_name: certificateData.artistName,
            artwork_medium: certificateData.artworkMedium,
            artwork_year: certificateData.artworkYear,
            purchase_date: certificateData.purchaseDate,
            buyer_name: certificateData.buyerName,
            buyer_email: certificateData.buyerEmail,
            is_generated: true,
            generated_at: new Date().toISOString(),
            verification_code: certificateData.verificationCode,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error creating certificate record', { error });
          throw error;
        }

        logger.info('Certificat créé avec succès', {
          certificateId: data.id,
          certificateNumber: certificateData.certificateNumber,
        });

        return data as ArtistCertificate;
      } catch (error) {
        logger.error('Error in useCreateArtistCertificate', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artist-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['artist-certificate', data.id] });
      queryClient.invalidateQueries({ queryKey: ['artist-certificates-order', variables.orderId] });
      
      toast({
        title: '✅ Certificat généré',
        description: 'Votre certificat d\'authenticité a été généré avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la génération du certificat.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour le compteur de téléchargements
 */
export const useUpdateCertificateDownload = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificateId: string) => {
      // Récupérer d'abord le certificat pour incrémenter
      const { data: currentCert } = await supabase
        .from('artist_product_certificates')
        .select('download_count')
        .eq('id', certificateId)
        .single();

      const { data, error } = await supabase
        .from('artist_product_certificates')
        .update({
          downloaded_at: new Date().toISOString(),
          download_count: (currentCert?.download_count || 0) + 1,
        })
        .eq('id', certificateId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating certificate download', { error, certificateId });
        throw error;
      }

      return data as ArtistCertificate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artist-certificate', data.id] });
    },
  });
};

/**
 * Hook pour vérifier un certificat par code de vérification
 */
export const useVerifyCertificate = (verificationCode: string | undefined) => {
  return useQuery({
    queryKey: ['verify-certificate', verificationCode],
    queryFn: async () => {
      if (!verificationCode) return null;

      const { data, error } = await supabase
        .from('artist_product_certificates')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('is_valid', true)
        .eq('revoked', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Error verifying certificate', { error, verificationCode });
        throw error;
      }

      return data as ArtistCertificate;
    },
    enabled: !!verificationCode && verificationCode.length >= 8,
  });
};

