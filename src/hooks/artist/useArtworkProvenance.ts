/**
 * Hooks pour la gestion de la provenance des œuvres
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ArtworkProvenance {
  id: string;
  product_id: string;
  store_id: string;
  provenance_type: 'creation' | 'ownership' | 'exhibition' | 'publication' | 'restoration' | 'authentication' | 'certification' | 'other';
  event_date: string;
  recorded_date: string;
  previous_owner_id?: string;
  previous_owner_name?: string;
  current_owner_id?: string;
  current_owner_name?: string;
  location_country?: string;
  location_city?: string;
  location_address?: string;
  description?: string;
  notes?: string;
  documents?: Array<{ url: string; type: string; description?: string }>;
  certificates?: Array<{ url: string; type: string; description?: string }>;
  blockchain_hash?: string;
  blockchain_tx_id?: string;
  blockchain_network?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ArtworkCertificate {
  id: string;
  product_id: string;
  store_id: string;
  certificate_type: 'authenticity' | 'provenance' | 'condition' | 'appraisal' | 'export' | 'other';
  certificate_number?: string;
  issued_by: string;
  issued_by_contact?: string;
  issued_date: string;
  expiry_date?: string;
  certificate_content?: string;
  certificate_pdf_url?: string;
  is_verified: boolean;
  verification_code?: string;
  qr_code_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Artwork3DModel {
  id: string;
  product_id: string;
  store_id: string;
  model_url: string;
  model_type: 'glb' | 'gltf' | 'obj' | 'fbx' | 'usd' | 'stl';
  model_size_bytes?: number;
  thumbnail_url?: string;
  preview_images?: string[];
  model_metadata?: Record<string, any>;
  auto_rotate: boolean;
  auto_play: boolean;
  show_controls: boolean;
  background_color: string;
  camera_position?: { x: number; y: number; z: number };
  camera_target?: { x: number; y: number; z: number };
  views_count: number;
  interactions_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer l'historique de provenance d'une œuvre
 */
export function useArtworkProvenanceHistory(productId: string) {
  return useQuery({
    queryKey: ['artwork-provenance', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_artwork_provenance_history', {
        p_product_id: productId,
      });

      if (error) {
        logger.error('Error fetching provenance history', { error });
        throw error;
      }

      return data as ArtworkProvenance[];
    },
    enabled: !!productId,
  });
}

/**
 * Récupérer les certificats d'une œuvre
 */
export function useArtworkCertificates(productId: string) {
  return useQuery({
    queryKey: ['artwork-certificates', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artwork_certificates')
        .select('*')
        .eq('product_id', productId)
        .order('issued_date', { ascending: false });

      if (error) {
        logger.error('Error fetching certificates', { error });
        throw error;
      }

      return data as ArtworkCertificate[];
    },
    enabled: !!productId,
  });
}

/**
 * Récupérer le modèle 3D d'une œuvre
 */
export function useArtwork3DModel(productId: string) {
  return useQuery({
    queryKey: ['artwork-3d-model', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_3d_models')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de modèle 3D
          return null;
        }
        logger.error('Error fetching 3D model', { error });
        throw error;
      }

      return data as Artwork3DModel;
    },
    enabled: !!productId,
  });
}

/**
 * Créer une entrée de provenance
 */
export function useCreateProvenance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (provenance: Partial<ArtworkProvenance>) => {
      const { data, error } = await supabase
        .from('artwork_provenance')
        .insert(provenance)
        .select()
        .single();

      if (error) {
        logger.error('Error creating provenance', { error });
        throw error;
      }

      return data as ArtworkProvenance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artwork-provenance', data.product_id] });
      toast({
        title: 'Provenance créée',
        description: 'L\'entrée de provenance a été créée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'entrée de provenance.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Créer un certificat
 */
export function useCreateCertificate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificate: Partial<ArtworkCertificate>) => {
      // Générer le numéro de certificat si non fourni
      if (!certificate.certificate_number) {
        const { data: certNumber } = await supabase.rpc('generate_certificate_number');
        certificate.certificate_number = certNumber;
      }

      const { data, error } = await supabase
        .from('artwork_certificates')
        .insert(certificate)
        .select()
        .single();

      if (error) {
        logger.error('Error creating certificate', { error });
        throw error;
      }

      return data as ArtworkCertificate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artwork-certificates', data.product_id] });
      toast({
        title: 'Certificat créé',
        description: `Le certificat ${data.certificate_number} a été créé avec succès.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le certificat.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Incrémenter les vues d'un modèle 3D
 */
export function useIncrement3DModelViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string) => {
      const { data, error } = await supabase.rpc('increment_3d_model_views', {
        p_model_id: modelId,
      });

      if (error) {
        logger.error('Error incrementing 3D model views', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ['artwork-3d-model'] });
    },
  });
}







