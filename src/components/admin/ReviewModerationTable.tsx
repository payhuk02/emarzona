/**
 * Review Moderation Table Component
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, CheckCircle, XCircle, Flag, Eye, Search, AlertTriangle } from 'lucide-react';
import { ReviewStars } from '@/components/reviews/ReviewStars';
import type { Review } from '@/types/review';
import { detectSpam } from '@/utils/spamDetection';

interface ReviewModerationTableProps {
  reviews: Review[];
  onApprove?: (reviewIds: string[]) => void;
  onReject?: (reviewIds: string[]) => void;
  onFlag?: (reviewIds: string[]) => void;
  onDelete?: (reviewIds: string[]) => void;
  loading?: boolean;
}

export const ReviewModerationTable: React.FC<ReviewModerationTableProps> = ({
  reviews = [],
  onApprove,
  onReject,
  onFlag,
  onDelete,
  loading = false,
}) => {
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter reviews by search
  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.content?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower) ||
      review.reviewer_name?.toLowerCase().includes(searchLower)
    );
  });

  // Toggle selection
  const toggleSelect = (reviewId: string) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map((r) => r.id));
    }
  };

  // Handle actions
  const handleApprove = (reviewIds: string[]) => {
    onApprove?.(reviewIds);
    setSelectedReviews([]);
  };

  const handleReject = (reviewIds: string[]) => {
    onReject?.(reviewIds);
    setSelectedReviews([]);
  };

  const handleFlag = (reviewIds: string[]) => {
    onFlag?.(reviewIds);
    setSelectedReviews([]);
  };

  const handleDelete = (reviewIds: string[]) => {
    onDelete?.(reviewIds);
    setSelectedReviews([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un avis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedReviews.length} sélectionné(s)
            </span>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleApprove(selectedReviews)}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(selectedReviews)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFlag(selectedReviews)}
              className="gap-2"
            >
              <Flag className="h-4 w-4" />
              Signaler
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredReviews.length > 0 &&
                    selectedReviews.length === filteredReviews.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Avis</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucun avis à afficher
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedReviews.includes(review.id)}
                      onCheckedChange={() => toggleSelect(review.id)}
                    />
                  </TableCell>

                  {/* Content */}
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      {review.title && (
                        <p className="font-medium line-clamp-1">{review.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.content}
                      </p>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>
                    <ReviewStars rating={review.rating} size="sm" />
                  </TableCell>

                  {/* Product */}
                  <TableCell>
                    <Badge variant="outline">{review.product_type}</Badge>
                  </TableCell>

                  {/* Author */}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {review.reviewer_name || 'Anonyme'}
                      </p>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          Achat vérifié
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {review.is_approved ? (
                        <Badge variant="default">Approuvé</Badge>
                      ) : review.is_flagged ? (
                        <Badge variant="destructive">Signalé</Badge>
                      ) : (
                        <Badge variant="secondary">En attente</Badge>
                      )}
                      {(() => {
                        const spamResult = detectSpam(review.content || '', review.title);
                        if (spamResult.confidence > 0.3) {
                          return (
                            <Badge
                              variant={spamResult.isSpam ? 'destructive' : 'outline'}
                              className="text-xs gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Spam {Math.round(spamResult.confidence * 100)}%
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {}}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {!review.is_approved && (
                          <DropdownMenuItem onClick={() => handleApprove([review.id])}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approuver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleReject([review.id])}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFlag([review.id])}>
                          <Flag className="mr-2 h-4 w-4" />
                          Signaler
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete([review.id])}
                          className="text-destructive"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{filteredReviews.length} avis affichés</p>
      </div>
    </div>
  );
};

