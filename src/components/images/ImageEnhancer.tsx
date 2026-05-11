/**
 * Bouton premium « Améliorer avec l'IA ».
 * Appelle l'edge function `enhance-image` puis remonte le data URL résultant.
 */

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageEnhancerProps {
  imageUrl: string;
  instruction?: string;
  onEnhanced: (newDataUrl: string) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export const ImageEnhancer: React.FC<ImageEnhancerProps> = ({
  imageUrl,
  instruction,
  onEnhanced,
  variant = 'secondary',
  size = 'sm',
  className,
  label = 'Améliorer avec l\'IA',
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handle = async () => {
    if (!imageUrl) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { imageUrl, instruction },
      });
      if (error) throw error;
      const newUrl = (data as { imageUrl?: string })?.imageUrl;
      if (!newUrl) throw new Error('Aucune image renvoyée');
      onEnhanced(newUrl);
      toast({
        title: '✨ Image améliorée',
        description: 'Votre image a été optimisée avec l\'IA.',
      });
    } catch (err) {
      toast({
        title: 'Échec de l\'amélioration',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handle}
      disabled={loading || !imageUrl}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span className="ml-2">{loading ? 'Amélioration…' : label}</span>
    </Button>
  );
};

export default ImageEnhancer;
