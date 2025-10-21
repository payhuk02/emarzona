import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface KYCSubmission {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  city: string;
  country: string;
  document_type: 'cni' | 'passport' | 'drivers_license' | 'other';
  document_front_url: string;
  document_back_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KYCFormData {
  full_name: string;
  date_of_birth: string;
  address: string;
  city: string;
  country: string;
  document_type: 'cni' | 'passport' | 'drivers_license' | 'other';
  document_front: File;
  document_back?: File;
}

export const useKYC = () => {
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useQuery({
    queryKey: ['kyc-submission'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: submissionData, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      return submissionData && submissionData.length > 0 ? submissionData[0] as KYCSubmission : null;
    },
  });

  const uploadDocument = async (file: File, userId: string, type: 'front' | 'back') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const submitKYC = useMutation({
    mutationFn: async (formData: KYCFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload documents
      const frontUrl = await uploadDocument(formData.document_front, user.id, 'front');
      let backUrl = null;
      if (formData.document_back) {
        backUrl = await uploadDocument(formData.document_back, user.id, 'back');
      }

      // Create submission
      const { data, error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          document_type: formData.document_type,
          document_front_url: frontUrl,
          document_back_url: backUrl,
          status: 'pending',
        })
        .select()
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-submission'] });
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de vérification KYC a été soumise avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre la demande KYC',
        variant: 'destructive',
      });
    },
  });

  return {
    submission,
    isLoading,
    submitKYC: submitKYC.mutate,
    isSubmitting: submitKYC.isPending,
  };
};

export const useAdminKYC = () => {
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-kyc-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KYCSubmission[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      submissionId,
      status,
      rejectionReason,
    }: {
      submissionId: string;
      status: 'verified' | 'rejected';
      rejectionReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('kyc_submissions')
        .update({
          status,
          rejection_reason: rejectionReason || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-submissions'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut KYC a été mis à jour avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  return {
    submissions,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
  };
};
