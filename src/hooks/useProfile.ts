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
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
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
      
      // First try to get existing profile with basic fields
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, avatar_url, display_name, first_name, last_name, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        throw error;
      }

      // Create profile if it doesn't exist
      if (!data) {
        console.log('ℹ️  No profile found, creating new one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              display_name: user.email,
              first_name: null,
              last_name: null,
            },
          ])
          .select('id, user_id, avatar_url, display_name, first_name, last_name, created_at, updated_at')
          .single();

        if (createError) {
          console.error('❌ Profile creation error:', createError);
          throw createError;
        }
        
        console.log('✅ Profile created:', newProfile);
        setProfile(newProfile);
      } else {
        console.log('✅ Profile found:', data);
        setProfile(data);
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
      // Only update fields that exist in the database
      const safeUpdates: any = {};
      
      if (updates.first_name !== undefined) safeUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined) safeUpdates.last_name = updates.last_name;
      if (updates.display_name !== undefined) safeUpdates.display_name = updates.display_name;
      
      // Only include new fields if they exist (we'll add them later)
      // if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
      // if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
      // if (updates.location !== undefined) safeUpdates.location = updates.location;
      // if (updates.website !== undefined) safeUpdates.website = updates.website;

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

  return {
    profile,
    loading,
    uploading,
    uploadAvatar,
    removeAvatar,
    updateDisplayName,
    updateProfile,
    refetch: fetchProfile,
  };
};
