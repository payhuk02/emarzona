/**
 * Artist Specific Forms - Formulaires spécialisés par type d'artiste
 * Date: 28 Janvier 2025
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { ArtistProductFormData } from '@/types/artist-product';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface ArtistSpecificFormsProps {
  artistType: string;
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

const ArtistSpecificFormsComponent = ({ artistType, data, onUpdate }: ArtistSpecificFormsProps) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  // Écrivain
  if (artistType === 'writer') {
    const writerData = data.writer_specific || {};

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Informations du Livre</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="book_isbn">ISBN</Label>
            <Input
              id="book_isbn"
              placeholder="978-2-1234-5678-9"
              value={writerData.book_isbn || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: { ...writerData, book_isbn: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_pages">Nombre de pages</Label>
            <Input
              id="book_pages"
              type="number"
              min="1"
              placeholder="250"
              value={writerData.book_pages || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: {
                    ...writerData,
                    book_pages: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_language">Langue</Label>
            <Input
              id="book_language"
              placeholder="Français"
              value={writerData.book_language || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: { ...writerData, book_language: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_format">Format</Label>
            <Select
              value={writerData.book_format || 'paperback'}
              onValueChange={value =>
                onUpdate({
                  writer_specific: {
                    ...writerData,
                    book_format: value as 'paperback' | 'hardcover' | 'ebook',
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paperback">Broché</SelectItem>
                <SelectItem value="hardcover">Relié</SelectItem>
                <SelectItem value="ebook">Ebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_genre">Genre</Label>
            <Input
              id="book_genre"
              placeholder="Roman, Science-fiction, etc."
              value={writerData.book_genre || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: { ...writerData, book_genre: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_publisher">Éditeur</Label>
            <Input
              id="book_publisher"
              placeholder="Nom de l'éditeur"
              value={writerData.book_publisher || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: { ...writerData, book_publisher: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_publication_date">Date de publication</Label>
            <Input
              id="book_publication_date"
              type="date"
              value={writerData.book_publication_date || ''}
              onChange={e =>
                onUpdate({
                  writer_specific: { ...writerData, book_publication_date: e.target.value || null },
                })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Musicien
  if (artistType === 'musician') {
    const musicianData = data.musician_specific || {};
    const tracks = musicianData.album_tracks || [];

    const addTrack = () => {
      onUpdate({
        musician_specific: {
          ...musicianData,
          album_tracks: [...tracks, { title: '', duration: 0, artist: '' }],
        },
      });
    };

    const updateTrack = (index: number, field: string, value: string | number) => {
      const newTracks = [...tracks];
      newTracks[index] = { ...newTracks[index], [field]: value };
      onUpdate({
        musician_specific: {
          ...musicianData,
          album_tracks: newTracks,
        },
      });
    };

    const removeTrack = (index: number) => {
      const newTracks = tracks.filter((_, i) => i !== index);
      onUpdate({
        musician_specific: {
          ...musicianData,
          album_tracks: newTracks,
        },
      });
    };

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Informations de l'Album</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="album_format">Format</Label>
            <Select
              value={musicianData.album_format || 'digital'}
              onValueChange={value =>
                onUpdate({
                  musician_specific: {
                    ...musicianData,
                    album_format: value as 'cd' | 'vinyl' | 'digital' | 'cassette',
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cd">CD</SelectItem>
                <SelectItem value="vinyl">Vinyle</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="cassette">Cassette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="album_genre">Genre musical</Label>
            <Input
              id="album_genre"
              placeholder="Rock, Pop, Jazz, etc."
              value={musicianData.album_genre || ''}
              onChange={e =>
                onUpdate({
                  musician_specific: { ...musicianData, album_genre: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album_label">Label</Label>
            <Input
              id="album_label"
              placeholder="Nom du label"
              value={musicianData.album_label || ''}
              onChange={e =>
                onUpdate({
                  musician_specific: { ...musicianData, album_label: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album_release_date">Date de sortie</Label>
            <Input
              id="album_release_date"
              type="date"
              value={musicianData.album_release_date || ''}
              onChange={e =>
                onUpdate({
                  musician_specific: {
                    ...musicianData,
                    album_release_date: e.target.value || null,
                  },
                })
              }
            />
          </div>
        </div>

        {/* Pistes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Pistes de l'album</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTrack}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une piste
            </Button>
          </div>

          {tracks.map((track, index) => (
            <div key={index} className="flex gap-2 items-center p-2 border rounded">
              <Input
                placeholder="Titre"
                value={track.title}
                onChange={e => updateTrack(index, 'title', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Durée (s)"
                value={track.duration}
                onChange={e => updateTrack(index, 'duration', parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeTrack(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Artiste visuel
  if (artistType === 'visual_artist') {
    const visualData = data.visual_artist_specific || {};

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Informations Artistiques</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="artwork_style">Style</Label>
            <Input
              id="artwork_style"
              placeholder="Réalisme, Abstrait, Impressionnisme, etc."
              value={visualData.artwork_style || ''}
              onChange={e =>
                onUpdate({
                  visual_artist_specific: { ...visualData, artwork_style: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artwork_subject">Sujet</Label>
            <Input
              id="artwork_subject"
              placeholder="Portrait, Paysage, Nature morte, etc."
              value={visualData.artwork_subject || ''}
              onChange={e =>
                onUpdate({
                  visual_artist_specific: { ...visualData, artwork_subject: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>
        </div>
      </div>
    );
  }

  // Designer
  if (artistType === 'designer') {
    const designerData = data.designer_specific || {};

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Informations du Design</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="design_category">Catégorie</Label>
            <Input
              id="design_category"
              placeholder="Logo, Template, Illustration, etc."
              value={designerData.design_category || ''}
              onChange={e =>
                onUpdate({
                  designer_specific: { ...designerData, design_category: e.target.value },
                })
              }
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="design_license_type">Type de licence</Label>
            <Select
              value={designerData.design_license_type || 'non_exclusive'}
              onValueChange={value =>
                onUpdate({
                  designer_specific: {
                    ...designerData,
                    design_license_type: value as 'exclusive' | 'non_exclusive' | 'royalty_free',
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Exclusive</SelectItem>
                <SelectItem value="non_exclusive">Non-exclusive</SelectItem>
                <SelectItem value="royalty_free">Royalty-free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Optimisation avec React.memo
export const ArtistSpecificForms = React.memo(
  ArtistSpecificFormsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.artistType === nextProps.artistType &&
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
    );
  }
);
