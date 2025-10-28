/**
 * Staff Card Component
 * Date: 28 octobre 2025
 * 
 * Carte professionnelle pour afficher les membres du staff avec :
 * - Avatar avec fallback initiales
 * - Informations détaillées
 * - Badges compétences
 * - Rating et reviews
 * - Social links
 * - Responsive variants
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mail,
  Phone,
  Calendar,
  Award,
  Star,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffCardProps {
  name: string;
  role?: string;
  bio?: string;
  avatar_url?: string | null;
  email?: string;
  phone?: string;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  location?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  availability?: 'available' | 'busy' | 'offline';
  variant?: 'default' | 'compact' | 'horizontal';
  className?: string;
  onContact?: () => void;
}

export const StaffCard = ({
  name,
  role,
  bio,
  avatar_url,
  email,
  phone,
  skills = [],
  rating,
  reviewCount,
  yearsExperience,
  location,
  socialLinks,
  availability = 'available',
  variant = 'default',
  className,
  onContact,
}: StaffCardProps) => {
  // Génère initiales pour fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const availabilityConfig = {
    available: {
      label: 'Disponible',
      color: 'bg-green-500',
      badgeVariant: 'default' as const,
    },
    busy: {
      label: 'Occupé',
      color: 'bg-yellow-500',
      badgeVariant: 'secondary' as const,
    },
    offline: {
      label: 'Hors ligne',
      color: 'bg-gray-500',
      badgeVariant: 'outline' as const,
    },
  };

  const availabilityStatus = availabilityConfig[availability];

  // Variant Compact (pour listes)
  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Avatar avec status indicator */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatar_url || undefined} alt={name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                  availabilityStatus.color
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{name}</h4>
              {role && (
                <p className="text-xs text-muted-foreground truncate">{role}</p>
              )}
              {rating !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                  {reviewCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({reviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Badge disponibilité */}
            <Badge variant={availabilityStatus.badgeVariant} className="text-xs">
              {availabilityStatus.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant Horizontal (pour détails)
  if (variant === 'horizontal') {
    return (
      <Card className={cn('hover:shadow-lg transition-shadow', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={avatar_url || undefined} alt={name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white',
                  availabilityStatus.color
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-xl font-bold">{name}</h3>
                    {role && (
                      <p className="text-sm text-muted-foreground mt-1">{role}</p>
                    )}
                  </div>
                  <Badge variant={availabilityStatus.badgeVariant}>
                    {availabilityStatus.label}
                  </Badge>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  {rating !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{rating.toFixed(1)}</span>
                      {reviewCount !== undefined && (
                        <span>({reviewCount} avis)</span>
                      )}
                    </div>
                  )}
                  {yearsExperience !== undefined && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{yearsExperience} ans d'expérience</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">{bio}</p>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Contact & Social */}
              <div className="flex flex-wrap gap-3">
                {onContact && (
                  <Button size="sm" onClick={onContact}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                )}
                {socialLinks && (
                  <div className="flex gap-2">
                    {socialLinks.linkedin && (
                      <Button
                        size="icon"
                        variant="outline"
                        asChild
                        className="h-8 w-8"
                      >
                        <a
                          href={socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {socialLinks.twitter && (
                      <Button
                        size="icon"
                        variant="outline"
                        asChild
                        className="h-8 w-8"
                      >
                        <a
                          href={socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {socialLinks.facebook && (
                      <Button
                        size="icon"
                        variant="outline"
                        asChild
                        className="h-8 w-8"
                      >
                        <a
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {socialLinks.instagram && (
                      <Button
                        size="icon"
                        variant="outline"
                        asChild
                        className="h-8 w-8"
                      >
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant Default (carte verticale)
  return (
    <Card className={cn('hover:shadow-lg transition-shadow h-full', className)}>
      <CardHeader className="text-center pb-4">
        {/* Avatar */}
        <div className="relative mx-auto mb-4">
          <Avatar className="h-24 w-24 mx-auto">
            <AvatarImage src={avatar_url || undefined} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'absolute bottom-0 right-1/2 translate-x-12 h-4 w-4 rounded-full border-2 border-white',
              availabilityStatus.color
            )}
          />
        </div>

        {/* Name & Role */}
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          {role && (
            <p className="text-sm text-muted-foreground mt-1">{role}</p>
          )}
        </div>

        {/* Badge disponibilité */}
        <Badge
          variant={availabilityStatus.badgeVariant}
          className="mx-auto mt-2 text-xs"
        >
          {availabilityStatus.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
            {reviewCount !== undefined && (
              <span className="text-sm text-muted-foreground">
                ({reviewCount} avis)
              </span>
            )}
          </div>
        )}

        {/* Meta info */}
        {(yearsExperience !== undefined || location) && (
          <div className="space-y-2 text-sm text-muted-foreground">
            {yearsExperience !== undefined && (
              <div className="flex items-center justify-center gap-2">
                <Award className="h-4 w-4" />
                <span>{yearsExperience} ans d'expérience</span>
              </div>
            )}
            {location && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-muted-foreground text-center line-clamp-4">
            {bio}
          </p>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {onContact && (
            <Button size="sm" className="w-full" onClick={onContact}>
              <Mail className="h-4 w-4 mr-2" />
              Contacter
            </Button>
          )}

          {/* Social links */}
          {socialLinks && (
            <div className="flex justify-center gap-2">
              {socialLinks.linkedin && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {socialLinks.twitter && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {socialLinks.facebook && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {socialLinks.instagram && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Staff List Component (for displaying multiple staff members)
 */
interface StaffListProps {
  staff: Array<{
    id: string;
    name: string;
    role?: string;
    bio?: string;
    avatar_url?: string | null;
    rating?: number;
    reviewCount?: number;
  }>;
  variant?: 'default' | 'compact' | 'horizontal';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const StaffList = ({
  staff,
  variant = 'default',
  columns = 3,
  className,
}: StaffListProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {staff.map((member) => (
        <StaffCard key={member.id} {...member} variant={variant} />
      ))}
    </div>
  );
};

