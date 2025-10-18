import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Pixel {
  id: string;
  user_id: string;
  pixel_type: 'facebook' | 'google' | 'tiktok' | 'pinterest' | 'custom';
  pixel_id: string;
  pixel_name: string | null;
  pixel_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PixelEvent {
  id: string;
  pixel_id: string;
  user_id: string;
  event_type: 'pageview' | 'add_to_cart' | 'purchase' | 'lead';
  product_id: string | null;
  order_id: string | null;
  event_data: any;
  created_at: string;
}

export const usePixels = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPixels();
    } else {
      setPixels([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPixels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_pixels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPixels((data || []) as Pixel[]);
    } catch (error: any) {
      console.error('Error fetching pixels:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les Pixels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPixel = async (pixelData: {
    pixel_type: string;
    pixel_id: string;
    pixel_name?: string;
    pixel_code?: string;
    is_active?: boolean;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_pixels')
        .insert([{
          user_id: user.id,
          ...pixelData,
        }]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: '✅ Votre Pixel a été ajouté avec succès.',
      });

      await fetchPixels();
      return true;
    } catch (error: any) {
      console.error('Error creating pixel:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le Pixel',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePixel = async (pixelId: string, updates: Partial<Pixel>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_pixels')
        .update(updates)
        .eq('id', pixelId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Pixel mis à jour avec succès',
      });

      await fetchPixels();
      return true;
    } catch (error: any) {
      console.error('Error updating pixel:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le Pixel',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deletePixel = async (pixelId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_pixels')
        .delete()
        .eq('id', pixelId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Pixel supprimé avec succès',
      });

      await fetchPixels();
      return true;
    } catch (error: any) {
      console.error('Error deleting pixel:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le Pixel',
        variant: 'destructive',
      });
      return false;
    }
  };

  const togglePixel = async (pixelId: string, isActive: boolean) => {
    return updatePixel(pixelId, { is_active: isActive });
  };

  const trackEvent = async (
    pixelId: string,
    eventType: 'pageview' | 'add_to_cart' | 'purchase' | 'lead',
    eventData?: {
      product_id?: string;
      order_id?: string;
      amount?: number;
      product_name?: string;
      customer_id?: string;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pixel_events')
        .insert([{
          pixel_id: pixelId,
          user_id: user.id,
          event_type: eventType,
          product_id: eventData?.product_id || null,
          order_id: eventData?.order_id || null,
          event_data: eventData || {},
        }]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error tracking event:', error);
      return false;
    }
  };

  return {
    pixels,
    loading,
    createPixel,
    updatePixel,
    deletePixel,
    togglePixel,
    trackEvent,
    refetch: fetchPixels,
  };
};
