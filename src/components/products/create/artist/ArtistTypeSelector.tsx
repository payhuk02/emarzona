/**
 * Artist Type Selector - Sélection du type d'artiste
 * Date: 28 Janvier 2025
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Music,
  Palette,
  Brush,
  Video,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArtistType } from '@/types/artist-product';

interface ArtistTypeOption {
  value: ArtistType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  examples: string[];
  color: string;
  gradient: string;
}

const ARTIST_TYPES: ArtistTypeOption[] = [
  {
    value: 'writer',
    label: 'Écrivain / Auteur',
    icon: BookOpen,
    description: 'Livres, romans, nouvelles, poèmes, guides',
    examples: ['Roman', 'Nouvelle', 'Poème', 'Guide', 'Manuel'],
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    value: 'musician',
    label: 'Musicien / Compositeur',
    icon: Music,
    description: 'Albums, singles, partitions, merchandising',
    examples: ['Album', 'Single', 'Partition', 'Merchandising'],
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    value: 'visual_artist',
    label: 'Artiste Visuel',
    icon: Palette,
    description: 'Peintures, dessins, photographies, sculptures',
    examples: ['Peinture', 'Dessin', 'Photo', 'Sculpture'],
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    value: 'designer',
    label: 'Designer / Créateur',
    icon: Brush,
    description: 'Designs graphiques, templates, illustrations, logos',
    examples: ['Design', 'Template', 'Illustration', 'Logo'],
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    value: 'multimedia',
    label: 'Artiste Multimédia',
    icon: Video,
    description: 'Vidéos d\'art, installations, contenus interactifs',
    examples: ['Vidéo', 'Installation', 'Interactive', 'NFT'],
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    value: 'other',
    label: 'Autre',
    icon: Sparkles,
    description: 'Autres types de créations artistiques',
    examples: ['Création', 'Artisanat', 'Autre'],
    color: 'text-gray-500',
    gradient: 'from-gray-500 to-slate-500',
  },
];

interface ArtistTypeSelectorProps {
  selectedType: ArtistType | null;
  onSelect: (type: ArtistType) => void;
}

const ArtistTypeSelectorComponent = ({ selectedType, onSelect }: ArtistTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Type d'artiste</h2>
        <p className="text-muted-foreground">
          Sélectionnez le type d'artiste qui correspond le mieux à votre création
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ARTIST_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.value;

          return (
            <Card
              key={type.value}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg',
                isSelected && 'ring-2 ring-primary shadow-lg'
              )}
              onClick={() => onSelect(type.value)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={cn('p-3 rounded-lg bg-gradient-to-br', `bg-gradient-to-br ${type.gradient} opacity-20`)}>
                    <Icon className={cn('h-6 w-6', type.color)} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <CardTitle className="text-lg">{type.label}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map((example, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Optimisation avec React.memo
export const ArtistTypeSelector = React.memo(ArtistTypeSelectorComponent);

