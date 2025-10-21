import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  referral_code: string | null;
  referred_by: string | null;
  total_referral_earnings: number;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔄 Fetching profile for user:', user.id);
      
      // Charger tous les champs du profil
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          user_id, 
          avatar_url, 
          display_name, 
          first_name, 
          last_name, 
          bio, 
          phone, 
          location, 
          website,
          referral_code,
          referred_by,
          total_referral_earnings,
          is_suspended,
          suspension_reason,
          suspended_at,
          suspended_by,
          created_at, 
          updated_at
        `)
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('❌ Profile fetch error:', error);
        throw error;
      }

      // Créer le profil s'il n'existe pas
      if (!data || data.length === 0) {
        console.log('ℹ️  No profile found, creating new one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              display_name: user.email,
              first_name: null,
              last_name: null,
              bio: null,
              phone: null,
              location: null,
              website: null,
            },
          ])
          .select(`
            id, 
            user_id, 
            avatar_url, 
            display_name, 
            first_name, 
            last_name, 
            bio, 
            phone, 
            location, 
            website,
            referral_code,
            referred_by,
            total_referral_earnings,
            is_suspended,
            suspension_reason,
            suspended_at,
            suspended_by,
            created_at, 
            updated_at
          `)
          .limit(1);

        if (createError) {
          console.error('❌ Profile creation error:', createError);
          throw createError;
        }
        
        console.log('✅ Profile created:', newProfile);
        setProfile(newProfile && newProfile.length > 0 ? newProfile[0] : null);
      } else {
        console.log('✅ Profile found:', data);
        setProfile(data[0]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching profile:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger le profil',
        variant: 'destructive',
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: 'Le fichier doit être une image',
          variant: 'destructive',
        });
        return null;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: 'L\'image ne doit pas dépasser 5 Mo',
          variant: 'destructive',
        });
        return null;
      }

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: 'Succès',
        description: 'Photo de profil mise à jour',
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    try {
      setUploading(true);

      // Delete from storage
      const oldPath = profile.avatar_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${oldPath}`]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, avatar_url: null } : null);

      toast({
        title: 'Succès',
        description: 'Photo de profil supprimée',
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);

      toast({
        title: 'Succès',
        description: 'Nom d\'affichage mis à jour',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating display name:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateProfile = async (updates: { 
    first_name?: string; 
    last_name?: string; 
    display_name?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
  }) => {
    if (!user) return false;

    try {
      // Mettre à jour tous les champs disponibles
      const safeUpdates: any = {};
      
      if (updates.first_name !== undefined) safeUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined) safeUpdates.last_name = updates.last_name;
      if (updates.display_name !== undefined) safeUpdates.display_name = updates.display_name;
      if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
      if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
      if (updates.location !== undefined) safeUpdates.location = updates.location;
      if (updates.website !== undefined) safeUpdates.website = updates.website;

      const { error } = await supabase
        .from('profiles')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...safeUpdates } : null);

      toast({
        title: 'Succès',
        description: 'Profil mis à jour',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Fonction pour obtenir les statistiques du profil
  const getProfileStats = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_profile_stats', { profile_user_id: user.id });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting profile stats:', error);
      return null;
    }
  };

  // Fonction pour obtenir le pourcentage de complétion du profil
  const getProfileCompletion = () => {
    if (!profile) return 0;

    const fields = [
      profile.display_name,
      profile.first_name,
      profile.last_name,
      profile.bio,
      profile.phone,
      profile.location,
      profile.website,
      profile.avatar_url
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Fonction pour obtenir les informations de parrainage
  const getReferralInfo = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, total_referral_earnings, referred_by')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Error getting referral info:', error);
      return null;
    }
  };

  // Fonction pour obtenir les profils parrainés
  const getReferredProfiles = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting referred profiles:', error);
      return [];
    }
  };

  return {
    profile,
    loading,
    uploading,
    uploadAvatar,
    removeAvatar,
    updateDisplayName,
    updateProfile,
    getProfileStats,
    getProfileCompletion,
    getReferralInfo,
    getReferredProfiles,
    refetch: fetchProfile,
  };
};
