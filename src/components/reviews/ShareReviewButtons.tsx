/**
 * Share Review Buttons Component
 * Date : 27 octobre 2025
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/types/review';

interface ShareReviewButtonsProps {
  review: Review;
  productName: string;
  productUrl?: string;
}

export const ShareReviewButtons: React.FC<ShareReviewButtonsProps> = ({
  review,
  productName,
  productUrl = window.location.href,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // Generate share text
  const getShareText = () => {
    const stars = '⭐'.repeat(review.rating);
    return `${stars} "${review.title || review.content?.substring(0, 50) || 'Great product'}..." - Mon avis sur ${productName}`;
  };

  // Generate full review URL
  const getReviewUrl = () => {
    return `${productUrl}#review-${review.id}`;
  };

  // Share handlers
  const shareOnTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getReviewUrl());
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    );
    trackShare('twitter');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getReviewUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=550,height=420'
    );
    trackShare('facebook');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getReviewUrl());
    const title = encodeURIComponent(getShareText());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
      '_blank',
      'width=550,height=420'
    );
    trackShare('linkedin');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()} ${getReviewUrl()}`);
    window.open(
      `https://wa.me/?text=${text}`,
      '_blank',
      'width=550,height=420'
    );
    trackShare('whatsapp');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReviewUrl());
      setCopied(true);
      toast({
        title: '✅ Lien copié',
        description: 'Le lien de l\'avis a été copié dans le presse-papiers.',
      });
      setTimeout(() => setCopied(false), 2000);
      trackShare('copy_link');
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de copier le lien.',
        variant: 'destructive',
      });
    }
  };

  // Track share (can be implemented with analytics)
  const trackShare = (platform: string) => {
    // TODO: Implement analytics tracking
    console.log(`Review ${review.id} shared on ${platform}`);
    
    // Example: Track with custom event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share_review', {
        review_id: review.id,
        platform,
        product_name: productName,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Partager cet avis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={shareOnTwitter} className="gap-2 cursor-pointer">
          <Twitter className="h-4 w-4" />
          <span>Twitter / X</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareOnFacebook} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareOnLinkedIn} className="gap-2 cursor-pointer">
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareOnWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyLink} className="gap-2 cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              <span>Copier le lien</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Compact share button for smaller spaces
 */
export const CompactShareButton: React.FC<ShareReviewButtonsProps> = (props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Same content as above */}
        <ShareReviewButtons {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

