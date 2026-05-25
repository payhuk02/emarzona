/**
 * Critères de segmentation dynamique (Phase 2)
 */
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface SegmentCriteria {
  tags?: string[];
  excluded_tags?: string[];
  has_purchased?: boolean;
  min_orders?: number;
  min_total_spent?: number;
}

interface SegmentCriteriaBuilderProps {
  criteria: SegmentCriteria;
  onChange: (criteria: SegmentCriteria) => void;
}

export const SegmentCriteriaBuilder = ({ criteria, onChange }: SegmentCriteriaBuilderProps) => {
  const tags = criteria.tags || [];
  const [tagInput, setTagInput] = React.useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    onChange({ ...criteria, tags: [...tags, t] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onChange({ ...criteria, tags: tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tags (au moins un)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Les contacts ayant l&apos;un de ces tags seront inclus.
        </p>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="ex: vip, newsletter"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            Ajouter
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Retirer le tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="has-purchased"
          checked={criteria.has_purchased === true || (criteria.min_orders ?? 0) >= 1}
          onCheckedChange={checked =>
            onChange({
              ...criteria,
              has_purchased: checked === true,
              min_orders:
                checked === true ? Math.max(criteria.min_orders ?? 1, 1) : criteria.min_orders,
            })
          }
        />
        <div>
          <Label htmlFor="has-purchased" className="cursor-pointer">
            A déjà commandé dans la boutique
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min-orders">Nombre minimum de commandes</Label>
          <Input
            id="min-orders"
            type="number"
            min={0}
            value={criteria.min_orders ?? ''}
            onChange={e =>
              onChange({
                ...criteria,
                min_orders: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="min-spent">Montant total minimum dépensé</Label>
          <Input
            id="min-spent"
            type="number"
            min={0}
            value={criteria.min_total_spent ?? ''}
            onChange={e =>
              onChange({
                ...criteria,
                min_total_spent: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
