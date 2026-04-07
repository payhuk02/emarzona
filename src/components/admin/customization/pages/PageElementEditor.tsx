/**
 * Éditeur d'éléments de page - Rendu des différents types de champs
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Upload, X } from 'lucide-react';
import { LazyImage } from '@/components/ui/lazy-image';
import type { PageElement } from './types';

interface PageElementEditorProps {
  pageId: string;
  element: PageElement;
  value: string | number | boolean;
  uploading: boolean;
  onChange: (pageId: string, key: string, value: unknown) => void;
  onImageUpload: (pageId: string, key: string, file: File) => void;
}

export const PageElementEditor = ({
  pageId,
  element,
  value,
  uploading,
  onChange,
  onImageUpload,
}: PageElementEditorProps) => {
  const stringValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const booleanValue = typeof value === 'boolean' ? value : element.defaultValue === 'true';

  switch (element.type) {
    case 'text':
      return (
        <Input
          value={stringValue}
          onChange={e => onChange(pageId, element.key, e.target.value)}
          placeholder={element.defaultValue}
          className="text-sm"
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={stringValue}
          onChange={e => onChange(pageId, element.key, e.target.value)}
          placeholder={element.defaultValue}
          rows={3}
          className="text-sm"
        />
      );

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={stringValue || element.defaultValue || '#000000'}
            onChange={e => onChange(pageId, element.key, e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={stringValue || element.defaultValue || ''}
            onChange={e => onChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            className="flex-1 text-sm"
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2">
          {value && (
            <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden">
              <LazyImage
                src={stringValue}
                alt={element.label}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onChange(pageId, element.key, '')}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(pageId, element.key, file);
              }}
              className="hidden"
              id={`image-${pageId}-${element.key}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`image-${pageId}-${element.key}`)?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {stringValue ? 'Remplacer' : 'Uploader'}
                </>
              )}
            </Button>
          </div>
        </div>
      );

    case 'font':
      return (
        <Select
          value={stringValue || element.defaultValue || 'Poppins'}
          onValueChange={val => onChange(pageId, element.key, val)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Poppins">Poppins</SelectItem>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="Roboto">Roboto</SelectItem>
            <SelectItem value="Open Sans">Open Sans</SelectItem>
            <SelectItem value="Montserrat">Montserrat</SelectItem>
          </SelectContent>
        </Select>
      );

    case 'number':
      return (
        <Input
          type="number"
          value={stringValue || element.defaultValue || 0}
          onChange={e => onChange(pageId, element.key, parseFloat(e.target.value) || 0)}
          className="text-sm"
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={stringValue || element.defaultValue || ''}
          onChange={e => onChange(pageId, element.key, e.target.value)}
          placeholder={element.defaultValue}
          className="text-sm"
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={booleanValue}
            onChange={e => onChange(pageId, element.key, e.target.checked)}
            className="rounded"
          />
          <Label className="text-sm">{element.label}</Label>
        </div>
      );

    default:
      return null;
  }
};
