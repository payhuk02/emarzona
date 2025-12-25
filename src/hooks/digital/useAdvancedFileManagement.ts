/**
 * Advanced File Management Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour gérer les versions, catégories et métadonnées de fichiers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  version_label: string;
  file_url: string;
  file_size_mb: number;
  file_hash?: string;
  checksum_sha256?: string;
  changelog?: string;
  release_notes?: string;
  is_stable: boolean;
  is_beta: boolean;
  is_alpha: boolean;
  released_at: string;
  deprecated_at?: string;
  download_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface FileCategory {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_category_id?: string;
  order_index: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  id: string;
  file_id: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  codec?: string;
  format_version?: string;
  page_count?: number;
  word_count?: number;
  language?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  copyright?: string;
  platform?: string[];
  architecture?: string[];
  minimum_requirements?: Record<string, any>;
  recommended_requirements?: Record<string, any>;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateFileVersionData {
  file_id: string;
  version_number: number;
  version_label: string;
  file_url: string;
  file_size_mb: number;
  file_hash?: string;
  checksum_sha256?: string;
  changelog?: string;
  release_notes?: string;
  is_stable?: boolean;
  is_beta?: boolean;
  is_alpha?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateFileCategoryData {
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_category_id?: string;
  order_index?: number;
  metadata?: Record<string, any>;
}

export interface UpdateFileMetadataData {
  width?: number;
  height?: number;
  duration_seconds?: number;
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  codec?: string;
  format_version?: string;
  page_count?: number;
  word_count?: number;
  language?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  copyright?: string;
  platform?: string[];
  architecture?: string[];
  minimum_requirements?: Record<string, any>;
  recommended_requirements?: Record<string, any>;
  custom_fields?: Record<string, any>;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Liste les versions d'un fichier
 */
export const useFileVersions = (fileId: string | undefined) => {
  return useQuery({
    queryKey: ['fileVersions', fileId],
    queryFn: async () => {
      if (!fileId) throw new Error('File ID manquant');

      const { data, error } = await supabase
        .from('digital_product_file_versions')
        .select('*')
        .eq('file_id', fileId)
        .order('version_number', { ascending: false });

      if (error) {
        logger.error('Error fetching file versions', { error, fileId });
        throw error;
      }

      return (data || []) as FileVersion[];
    },
    enabled: !!fileId,
  });
};

/**
 * Récupère la dernière version d'un fichier
 */
export const useLatestFileVersion = (fileId: string | undefined) => {
  return useQuery({
    queryKey: ['latestFileVersion', fileId],
    queryFn: async () => {
      if (!fileId) throw new Error('File ID manquant');

      const { data, error } = await supabase.rpc('get_latest_file_version', {
        p_file_id: fileId,
      });

      if (error) {
        logger.error('Error fetching latest file version', { error, fileId });
        throw error;
      }

      return data?.[0] as FileVersion | null;
    },
    enabled: !!fileId,
  });
};

/**
 * Liste les catégories de fichiers d'un store
 */
export const useFileCategories = (storeId?: string) => {
  return useQuery({
    queryKey: ['fileCategories', storeId],
    queryFn: async () => {
      if (!storeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!stores || stores.length === 0) {
          return [];
        }

        storeId = stores[0].id;
      }

      const { data, error } = await supabase
        .from('digital_product_file_categories')
        .select('*')
        .eq('store_id', storeId)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching file categories', { error, storeId });
        throw error;
      }

      return (data || []) as FileCategory[];
    },
    enabled: true,
  });
};

/**
 * Récupère les métadonnées d'un fichier
 */
export const useFileMetadata = (fileId: string | undefined) => {
  return useQuery({
    queryKey: ['fileMetadata', fileId],
    queryFn: async () => {
      if (!fileId) throw new Error('File ID manquant');

      const { data, error } = await supabase
        .from('digital_product_file_metadata')
        .select('*')
        .eq('file_id', fileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de métadonnées existantes
          return null;
        }
        logger.error('Error fetching file metadata', { error, fileId });
        throw error;
      }

      return data as FileMetadata | null;
    },
    enabled: !!fileId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Créer une nouvelle version de fichier
 */
export const useCreateFileVersion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateFileVersionData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: version, error } = await supabase
        .from('digital_product_file_versions')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating file version', { error, data });
        throw error;
      }

      return version as FileVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fileVersions', variables.file_id] });
      queryClient.invalidateQueries({ queryKey: ['latestFileVersion', variables.file_id] });
      toast({
        title: 'Version créée',
        description: `La version ${variables.version_label} a été créée avec succès`,
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateFileVersion', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la version',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Créer une catégorie de fichiers
 */
export const useCreateFileCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateFileCategoryData) => {
      const { data: category, error } = await supabase
        .from('digital_product_file_categories')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('Error creating file category', { error, data });
        throw error;
      }

      return category as FileCategory;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fileCategories', variables.store_id] });
      toast({
        title: 'Catégorie créée',
        description: 'La catégorie a été créée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateFileCategory', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la catégorie',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Mettre à jour les métadonnées d'un fichier
 */
export const useUpdateFileMetadata = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      fileId,
      data,
    }: {
      fileId: string;
      data: UpdateFileMetadataData;
    }) => {
      // Vérifier si les métadonnées existent
      const { data: existing } = await supabase
        .from('digital_product_file_metadata')
        .select('id')
        .eq('file_id', fileId)
        .single();

      let result;
      if (existing) {
        // Mise à jour
        const { data: updated, error } = await supabase
          .from('digital_product_file_metadata')
          .update(data)
          .eq('file_id', fileId)
          .select()
          .single();

        if (error) throw error;
        result = updated;
      } else {
        // Création
        const { data: created, error } = await supabase
          .from('digital_product_file_metadata')
          .insert({
            file_id: fileId,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        result = created;
      }

      return result as FileMetadata;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fileMetadata', variables.fileId] });
      toast({
        title: 'Métadonnées mises à jour',
        description: 'Les métadonnées ont été mises à jour avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateFileMetadata', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les métadonnées',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Archiver un fichier
 */
export const useArchiveFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('digital_product_files')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq('id', fileId);

      if (error) {
        logger.error('Error archiving file', { error, fileId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProductFiles'] });
      toast({
        title: 'Fichier archivé',
        description: 'Le fichier a été archivé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useArchiveFile', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'archiver le fichier',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Mettre à jour un fichier avec nouvelles colonnes
 */
export const useUpdateFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      fileId,
      data,
    }: {
      fileId: string;
      data: Partial<{
        name: string;
        category: string;
        file_version: string;
        version_number: number;
        description: string;
        tags: string[];
        metadata: Record<string, any>;
        compression_enabled: boolean;
        compression_ratio: number;
        checksum_sha256: string;
        mime_type: string;
        changelog: string;
      }>;
    }) => {
      const { data: file, error } = await supabase
        .from('digital_product_files')
        .update(data)
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating file', { error, fileId, data });
        throw error;
      }

      return file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProductFiles'] });
      toast({
        title: 'Fichier mis à jour',
        description: 'Le fichier a été mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateFile', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le fichier',
        variant: 'destructive',
      });
    },
  });
};

