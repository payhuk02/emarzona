/**
 * Artist Specific Forms - Formulaires spécialisés par type d'artiste
 * Date: 28 Janvier 2025
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArtistFormField } from './ArtistFormField';
import { getFieldHelpHint, formatHelpHint } from '@/lib/artist-product-help-hints';
import {
  validateISBN,
  validateLanguageCode,
  validateLength,
  validateDimension,
} from '@/lib/artist-product-validators';
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
            <ArtistFormField
              id="book_isbn"
              label="ISBN"
              value={writerData.book_isbn || ''}
              onChange={value =>
                onUpdate({
                  writer_specific: { ...writerData, book_isbn: value as string },
                })
              }
              placeholder="978-2-1234-5678-9"
              maxLength={20}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('book_isbn') || {
                  hint: 'Numéro ISBN du livre (ISBN-10 ou ISBN-13)',
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateISBN(value as string);
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="book_pages"
              label="Nombre de pages"
              value={writerData.book_pages || null}
              onChange={value =>
                onUpdate({
                  writer_specific: {
                    ...writerData,
                    book_pages: value
                      ? typeof value === 'number'
                        ? value
                        : parseInt(value.toString())
                      : null,
                  },
                })
              }
              type="number"
              min={1}
              placeholder="250"
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('book_pages') || { hint: 'Nombre total de pages du livre' }
              )}
              validationFn={value => {
                if (value === null || value === undefined || value === '') return null; // Optionnel
                const numValue = typeof value === 'number' ? value : parseInt(value.toString());
                return validateDimension(numValue);
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="book_language"
              label="Langue"
              value={writerData.book_language || ''}
              onChange={value =>
                onUpdate({
                  writer_specific: { ...writerData, book_language: value as string },
                })
              }
              placeholder="Français ou code ISO (ex: fr)"
              maxLength={50}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('book_language') || {
                  hint: 'Langue du livre (code ISO 639-1 ou nom complet)',
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateLanguageCode(value as string);
              }}
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
              <SelectContent mobileVariant="sheet">
                <SelectItem value="paperback">Broché</SelectItem>
                <SelectItem value="hardcover">Relié</SelectItem>
                <SelectItem value="ebook">Ebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="book_genre"
              label="Genre"
              value={writerData.book_genre || ''}
              onChange={value =>
                onUpdate({
                  writer_specific: { ...writerData, book_genre: value as string },
                })
              }
              placeholder="Roman, Science-fiction, etc."
              maxLength={100}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('book_genre') || { hint: 'Genre littéraire du livre' }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 100, 'Le genre du livre');
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="book_publisher"
              label="Éditeur"
              value={writerData.book_publisher || ''}
              onChange={value =>
                onUpdate({
                  writer_specific: { ...writerData, book_publisher: value as string },
                })
              }
              placeholder="Nom de l'éditeur"
              maxLength={200}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('book_publisher') || { hint: "Nom de la maison d'édition" }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 200, "L'éditeur");
              }}
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
              <SelectContent mobileVariant="sheet">
                <SelectItem value="cd">CD</SelectItem>
                <SelectItem value="vinyl">Vinyle</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="cassette">Cassette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="album_genre"
              label="Genre musical"
              value={musicianData.album_genre || ''}
              onChange={value =>
                onUpdate({
                  musician_specific: { ...musicianData, album_genre: value as string },
                })
              }
              placeholder="Rock, Pop, Jazz, etc."
              maxLength={100}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('album_genre') || { hint: "Genre musical de l'album" }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 100, 'Le genre musical');
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="album_label"
              label="Label"
              value={musicianData.album_label || ''}
              onChange={value =>
                onUpdate({
                  musician_specific: { ...musicianData, album_label: value as string },
                })
              }
              placeholder="Nom du label"
              maxLength={200}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('album_label') || {
                  hint: "Label discographique qui a édité l'album",
                }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 200, 'Le label');
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="album_release_date"
              label="Date de sortie"
              value={musicianData.album_release_date || ''}
              onChange={value =>
                onUpdate({
                  musician_specific: {
                    ...musicianData,
                    album_release_date: (value as string) || null,
                  },
                })
              }
              type="date"
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('album_release_date') || {
                  hint: "Date de sortie officielle de l'album",
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null; // Optionnel
                const dateValue = new Date(value as string);
                if (isNaN(dateValue.getTime())) {
                  return 'Date invalide';
                }
                return null;
              }}
              onKeyDown={handleSpaceKeyDown}
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
              <ArtistFormField
                id={`track_title_${index}`}
                label="Titre"
                value={track.title}
                onChange={value => updateTrack(index, 'title', value as string)}
                placeholder="Titre de la piste"
                maxLength={200}
                showCharCount
                showHelpIcon
                helpHint={formatHelpHint(
                  getFieldHelpHint('track_title') || { hint: 'Titre de la piste musicale' }
                )}
                validationFn={value => {
                  if (!value || (value as string).trim().length === 0) {
                    return 'Le titre de la piste est requis';
                  }
                  return validateLength(value as string, 1, 200, 'Le titre de la piste');
                }}
                onKeyDown={handleSpaceKeyDown}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Durée (s)"
                value={track.duration}
                onChange={e => updateTrack(index, 'duration', parseInt(e.target.value) || 0)}
                className="w-24"
                min={0}
                max={3600}
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
            <ArtistFormField
              id="artwork_style"
              label="Style"
              value={visualData.artwork_style || ''}
              onChange={value =>
                onUpdate({
                  visual_artist_specific: { ...visualData, artwork_style: value as string },
                })
              }
              placeholder="Réalisme, Abstrait, Impressionnisme, etc."
              maxLength={100}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artwork_style') || { hint: "Style artistique de l'œuvre" }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 100, 'Le style artistique');
              }}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>

          <div className="space-y-2">
            <ArtistFormField
              id="artwork_subject"
              label="Sujet"
              value={visualData.artwork_subject || ''}
              onChange={value =>
                onUpdate({
                  visual_artist_specific: { ...visualData, artwork_subject: value as string },
                })
              }
              placeholder="Portrait, Paysage, Nature morte, etc."
              maxLength={100}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artwork_subject') || { hint: "Sujet principal de l'œuvre" }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 100, 'Le sujet artistique');
              }}
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
            <ArtistFormField
              id="design_category"
              label="Catégorie"
              value={designerData.design_category || ''}
              onChange={value =>
                onUpdate({
                  designer_specific: { ...designerData, design_category: value as string },
                })
              }
              placeholder="Logo, Template, Illustration, etc."
              maxLength={100}
              showCharCount
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('design_category') || { hint: 'Catégorie du design' }
              )}
              validationFn={value => {
                return validateLength(value as string, 0, 100, 'La catégorie de design');
              }}
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
              <SelectContent mobileVariant="sheet">
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






