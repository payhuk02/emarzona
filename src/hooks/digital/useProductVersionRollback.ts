/**
 * Product Version Rollback Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks spécialisés pour le rollback de versions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { versionKeys } from './useProductVersions';

// =====================================================
// TYPES
// =====================================================

export interface RollbackLog {
  id: string;
  version_id: string;
  rolled_back_to_version_id?: string;
  rollback_type: 'automatic' | 'manual' | 'scheduled';
  rollback_reason: string;
  rollback_triggered_by?: string;
  error_rate_percentage?: number;
  total_downloads?: number;
  total_errors?: number;
  metrics_snapshot?: Record<string, any>;
  rollback_status: 'success' | 'failed' | 'partial';
  error_message?: string;
  rolled_back_at: string;
  created_at: string;
}

export interface VersionDownloadError {
  id: string;
  version_id: string;
  user_id?: string;
  error_type: string;
  error_message?: string;
  error_code?: string;
  error_stack?: string;
  download_url?: string;
  file_size_mb?: number;
  user_agent?: string;
  ip_address?: string;
  country?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Check and trigger rollback for a version
 */
export function useCheckAndTriggerRollback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.rpc('check_and_trigger_rollback', {
        p_version_id: versionId,
      });

      if (error) {
        logger.error('Error checking rollback', { error, versionId });
        throw error;
      }
      return data;
    },
    onSuccess: (data, versionId) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(versionId) });
      queryClient.invalidateQueries({ queryKey: versionKeys.all });
      
      if (data.success && data.action === 'rolled_back') {
        toast({
          title: '✅ Rollback effectué',
          description: `La version a été rollback vers ${data.rolled_back_to_version}`,
        });
      } else if (data.success && data.action === 'monitoring') {
        toast({
          title: '📊 Monitoring',
          description: data.message || 'Le système surveille cette version',
        });
      }
    },
    onError: (error: any) => {
      logger.error('Error checking rollback', { error });
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de vérifier le rollback',
      });
    },
  });
}

/**
 * Manual rollback
 */
export function useManualRollback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      versionId,
      rollbackToVersionId,
      reason,
    }: {
      versionId: string;
      rollbackToVersionId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.rpc('manual_rollback_version', {
        p_version_id: versionId,
        p_rollback_to_version_id: rollbackToVersionId,
        p_reason: reason,
        p_triggered_by: user.id,
      });

      if (error) {
        logger.error('Error manual rollback', { error, versionId });
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.all });
      toast({
        title: '✅ Rollback manuel effectué',
        description: `Rollback de ${data.rolled_back_from} vers ${data.rolled_back_to}`,
      });
    },
    onError: (error: any) => {
      logger.error('Error manual rollback', { error });
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'effectuer le rollback',
      });
    },
  });
}

/**
 * Get rollback logs for a version
 */
export function useVersionRollbackLogs(versionId: string | undefined) {
  return useQuery({
    queryKey: [...versionKeys.detail(versionId || ''), 'rollback-logs'],
    queryFn: async () => {
      if (!versionId) throw new Error('Version ID manquant');

      const { data, error } = await supabase
        .from('version_rollback_logs')
        .select('*')
        .eq('version_id', versionId)
        .order('rolled_back_at', { ascending: false });

      if (error) {
        logger.error('Error fetching rollback logs', { error, versionId });
        throw error;
      }
      return (data || []) as RollbackLog[];
    },
    enabled: !!versionId,
  });
}

/**
 * Get version download errors
 */
export function useVersionDownloadErrors(versionId: string | undefined) {
  return useQuery({
    queryKey: [...versionKeys.detail(versionId || ''), 'errors'],
    queryFn: async () => {
      if (!versionId) throw new Error('Version ID manquant');

      const { data, error } = await supabase
        .from('version_download_errors')
        .select('*')
        .eq('version_id', versionId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching version errors', { error, versionId });
        throw error;
      }
      return (data || []) as VersionDownloadError[];
    },
    enabled: !!versionId,
  });
}

/**
 * Report a download error (for users)
 */
export function useReportVersionError() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      versionId,
      errorType,
      errorMessage,
      errorCode,
      metadata,
    }: {
      versionId: string;
      errorType: string;
      errorMessage?: string;
      errorCode?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('version_download_errors')
        .insert({
          version_id: versionId,
          user_id: user?.id || null,
          error_type: errorType,
          error_message: errorMessage,
          error_code: errorCode,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) {
        logger.error('Error reporting version error', { error, versionId });
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...versionKeys.detail(variables.versionId), 'errors'] 
      });
      // Déclencher une vérification de rollback
      queryClient.invalidateQueries({ 
        queryKey: versionKeys.detail(variables.versionId) 
      });
      
      toast({
        title: '✅ Erreur signalée',
        description: 'Votre rapport a été enregistré. Merci !',
      });
    },
    onError: (error: any) => {
      logger.error('Error reporting version error', { error });
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de signaler l\'erreur',
      });
    },
  });
}

/**
 * Get version error rate
 */
export function useVersionErrorRate(versionId: string | undefined) {
  return useQuery({
    queryKey: [...versionKeys.detail(versionId || ''), 'error-rate'],
    queryFn: async () => {
      if (!versionId) throw new Error('Version ID manquant');

      const { data, error } = await supabase.rpc('calculate_version_error_rate', {
        p_version_id: versionId,
      });

      if (error) {
        logger.error('Error calculating error rate', { error, versionId });
        throw error;
      }
      return data as number;
    },
    enabled: !!versionId,
    refetchInterval: 60000, // Refresh every minute for monitoring
  });
}

