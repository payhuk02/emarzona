/**
 * Review Moderation Table Component
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  StableDropdownMenu,
  StableDropdownMenuItem,
  StableDropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Search,
  AlertTriangle,
} from 'lucide-react';
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
  const isMobile = useIsMobile();
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter reviews by search
  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.content?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower) ||
      review.reviewer_name?.toLowerCase().includes(searchLower)
    );
  });

  // Toggle selection
  const toggleSelect = (reviewId: string) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId) ? prev.filter(id => id !== reviewId) : [...prev, reviewId]
    );
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
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
    <div className="space-y-3 sm:space-y-4">
      {/* Toolbar - Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un avis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        {/* Bulk Actions - Responsive */}
        {selectedReviews.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              {selectedReviews.length} sélectionné(s)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleApprove(selectedReviews)}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none"
              >
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Approuver</span>
                <span className="sm:hidden">Approuver</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(selectedReviews)}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none"
              >
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Rejeter</span>
                <span className="sm:hidden">Rejeter</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFlag(selectedReviews)}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none"
              >
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Signaler</span>
                <span className="sm:hidden">Signaler</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Table Card View */}
      {isMobile ? (
        filteredReviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Aucun avis à afficher</p>
          </div>
        ) : (
          <MobileTableCard
            data={filteredReviews.map(r => ({ ...r, id: r.id }))}
            columns={[
              {
                key: 'content',
                label: 'Avis',
                priority: 'high',
                render: (row: Review) => (
                  <div className="space-y-1">
                    {row.title && <p className="font-medium text-sm line-clamp-1">{row.title}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2">{row.content}</p>
                  </div>
                ),
              },
              {
                key: 'rating',
                label: 'Note',
                priority: 'high',
                render: (row: Review) => <ReviewStars rating={row.rating} size="sm" />,
              },
              {
                key: 'author',
                label: 'Auteur',
                priority: 'medium',
                render: (row: Review) => (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{row.reviewer_name || 'Anonyme'}</p>
                    {row.is_verified_purchase && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                ),
              },
              {
                key: 'product',
                label: 'Produit',
                priority: 'low',
                render: (row: Review) => (
                  <Badge variant="outline" className="text-xs">
                    {row.product_type}
                  </Badge>
                ),
              },
              {
                key: 'status',
                label: 'Statut',
                priority: 'high',
                render: (row: Review) => {
                  const spamResult = detectSpam(row.content || '', row.title);
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      {row.is_approved ? (
                        <Badge variant="default" className="text-[10px]">
                          Approuvé
                        </Badge>
                      ) : row.is_flagged ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Signalé
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          En attente
                        </Badge>
                      )}
                      {spamResult.confidence > 0.3 && (
                        <Badge
                          variant={spamResult.isSpam ? 'destructive' : 'outline'}
                          className="text-[10px] gap-1"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Spam {Math.round(spamResult.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'date',
                label: 'Date',
                priority: 'low',
                render: (row: Review) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                ),
              },
            ]}
            actions={(row: Review) => (
              <div className="flex flex-col gap-2">
                <Checkbox
                  checked={selectedReviews.includes(row.id)}
                  onCheckedChange={() => toggleSelect(row.id)}
                  className="h-4 w-4"
                />
                <div className="flex gap-2">
                  {!row.is_approved && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove([row.id])}
                      className="min-h-[44px] flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject([row.id])}
                    className="min-h-[44px] flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFlag([row.id])}
                    className="min-h-[44px] flex-1"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Signaler
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete([row.id])}
                    className="min-h-[44px] flex-1 text-destructive"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          />
        )
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sm:w-12">
                    <Checkbox
                      checked={
                        filteredReviews.length > 0 &&
                        selectedReviews.length === filteredReviews.length
                      }
                      onCheckedChange={toggleSelectAll}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px] sm:min-w-[250px]">Avis</TableHead>
                  <TableHead className="min-w-[80px]">Note</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">Produit</TableHead>
                  <TableHead className="min-w-[120px] sm:min-w-[150px]">Auteur</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[100px] sm:min-w-[120px]">Statut</TableHead>
                  <TableHead className="w-10 sm:w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8 sm:py-12"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm sm:text-base">Aucun avis à afficher</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map(review => (
                    <TableRow key={review.id}>
                      {/* Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedReviews.includes(review.id)}
                          onCheckedChange={() => toggleSelect(review.id)}
                          className="h-4 w-4 sm:h-5 sm:w-5"
                        />
                      </TableCell>

                      {/* Content */}
                      <TableCell className="max-w-[200px] sm:max-w-md">
                        <div className="space-y-1">
                          {review.title && (
                            <p className="font-medium line-clamp-1 text-xs sm:text-sm">
                              {review.title}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {review.content}
                          </p>
                        </div>
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        <div className="flex items-center">
                          <ReviewStars rating={review.rating} size="sm" />
                        </div>
                      </TableCell>

                      {/* Product - Hidden on mobile */}
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {review.product_type}
                        </Badge>
                      </TableCell>

                      {/* Author */}
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium line-clamp-1">
                            {review.reviewer_name || 'Anonyme'}
                          </p>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Vérifié
                            </Badge>
                          )}
                          {/* Show product type on mobile */}
                          <div className="sm:hidden">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {review.product_type}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date - Hidden on mobile */}
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {review.is_approved ? (
                            <Badge variant="default" className="text-[10px] sm:text-xs">
                              Approuvé
                            </Badge>
                          ) : review.is_flagged ? (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs">
                              Signalé
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              En attente
                            </Badge>
                          )}
                          {(() => {
                            const spamResult = detectSpam(review.content || '', review.title);
                            if (spamResult.confidence > 0.3) {
                              return (
                                <Badge
                                  variant={spamResult.isSpam ? 'destructive' : 'outline'}
                                  className="text-[10px] gap-1"
                                >
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {Math.round(spamResult.confidence * 100)}%
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                          {/* Show date on mobile */}
                          <div className="md:hidden text-[10px] text-muted-foreground mt-1">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <StableDropdownMenu
                          triggerProps={{
                            variant: 'ghost' as const,
                            size: 'icon' as const,
                            className: 'h-8 w-8 sm:h-9 sm:w-9',
                            'aria-label': `Actions pour l'avis ${review.id}`,
                          }}
                          triggerContent={<MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        >
                          <StableDropdownMenuItem onClick={() => {}} className="text-xs sm:text-sm">
                            <span className="flex items-center">
                              <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Voir détails
                            </span>
                          </StableDropdownMenuItem>
                          {!review.is_approved && (
                            <StableDropdownMenuItem
                              onClick={() => handleApprove([review.id])}
                              className="text-xs sm:text-sm"
                            >
                              <span className="flex items-center">
                                <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Approuver
                              </span>
                            </StableDropdownMenuItem>
                          )}
                          <StableDropdownMenuItem
                            onClick={() => handleReject([review.id])}
                            className="text-xs sm:text-sm"
                          >
                            <span className="flex items-center">
                              <XCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Rejeter
                            </span>
                          </StableDropdownMenuItem>
                          <StableDropdownMenuItem
                            onClick={() => handleFlag([review.id])}
                            className="text-xs sm:text-sm"
                          >
                            <span className="flex items-center">
                              <Flag className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Signaler
                            </span>
                          </StableDropdownMenuItem>
                          <StableDropdownMenuItem
                            onClick={() => handleDelete([review.id])}
                            className="text-destructive text-xs sm:text-sm"
                          >
                            <span className="flex items-center">Supprimer</span>
                          </StableDropdownMenuItem>
                        </StableDropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer - Responsive */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
        <p>{filteredReviews.length} avis affichés</p>
      </div>
    </div>
  );
};
