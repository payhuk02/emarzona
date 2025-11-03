/**
 * Composant CartEmpty - Panier vide
 * Date: 26 Janvier 2025
 */

import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CartEmpty() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Votre panier est vide</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ajoutez des produits à votre panier pour commencer vos achats
      </p>

      <Button
        onClick={() => navigate('/marketplace')}
        size="lg"
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Continuer mes achats
      </Button>
    </div>
  );
}

