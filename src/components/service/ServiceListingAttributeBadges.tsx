import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getServiceListingAttributeChips,
  type ServiceListingChip,
} from '@/lib/services/service-listing-attributes';
import type { ServiceCategoryAttributes } from '@/lib/services/service-form-profiles';

interface ServiceListingAttributeBadgesProps {
  categorySlug?: string | null;
  parentSlug?: string | null;
  attributes?: ServiceCategoryAttributes | null;
  max?: number;
  className?: string;
}

export function ServiceListingAttributeBadges({
  categorySlug,
  parentSlug,
  attributes,
  max = 3,
  className,
}: ServiceListingAttributeBadgesProps) {
  const chips: ServiceListingChip[] = getServiceListingAttributeChips({
    categorySlug,
    parentSlug,
    attributes,
    max,
  });
  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {chips.map(chip => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="max-w-full truncate text-[10px] sm:text-xs font-normal"
          title={`${chip.label} : ${chip.value}`}
        >
          <span className="text-muted-foreground mr-1">{chip.label}</span>
          {chip.value}
        </Badge>
      ))}
    </div>
  );
}
