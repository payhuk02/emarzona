'use client';

import React, { useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEOPageData } from '@/hooks/useSEOAnalysis';
import { getScoreBadgeVariant, getScoreColor } from '@/lib/seo-analyzer';
import {
  Eye,
  ExternalLink,
  MoreVertical,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { SEODetailDialog } from './SEODetailDialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';

import Papa from 'papaparse';
import { saveAs } from 'file-saver';

interface SEOPagesListProps {
  data: SEOPageData[] | undefined;
  isLoading: boolean;
}

const SEOPagesListComponent = ({ data, isLoading }: SEOPagesListProps) => {
  const listRef = useScrollAnimation<HTMLDivElement>();
  const [selectedPage, setSelectedPage] = useState<SEOPageData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(page => {
      const matchType = typeFilter === 'all' || page.type === typeFilter;
      const matchSearch =
        page.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        page.url.toLowerCase().includes(debouncedSearch.toLowerCase());
      const score = page.analysis.score.overall;
      const matchScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'good' && score >= 80) ||
        (scoreFilter === 'medium' && score >= 60 && score < 80) ||
        (scoreFilter === 'bad' && score < 60);
      return matchType && matchSearch && matchScore;
    });
  }, [data, typeFilter, scoreFilter, debouncedSearch]);

  const averageScore = useMemo(() => {
    if (!filteredData.length) return 0;
    const total = filteredData.reduce((acc, page) => acc + page.analysis.score.overall, 0);
    return Math.round(total / filteredData.length);
  }, [filteredData]);

  const optimizedCount = useMemo(
    () => filteredData.filter(p => p.analysis.score.overall >= 80).length,
    [filteredData]
  );

  const toFixCount = useMemo(
    () => filteredData.filter(p => p.analysis.score.overall < 70).length,
    [filteredData]
  );

  const goodRate = useMemo(() => {
    if (!filteredData.length) return 0;
    return Math.round((optimizedCount / filteredData.length) * 100);
  }, [filteredData, optimizedCount]);

  const columns = useMemo<ColumnDef<SEOPageData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nom de la Page',
        cell: ({ row }) => (
          <div className="font-semibold text-sm break-words max-w-[200px]">{row.original.name}</div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type === 'product' ? 'Produit' : 'Boutique'}
          </Badge>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Score SEO',
        cell: ({ row }) => {
          const score = row.original.analysis.score.overall;
          return (
            <div className="flex items-center gap-3">
              <Progress value={score} className="h-2 w-[80px]" />
              <span className={`font-bold text-sm ${getScoreColor(score)}`}>{score}/100</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'niveau',
        header: 'Niveau',
        cell: ({ row }) => {
          const score = row.original.analysis.score.overall;
          return (
            <Badge variant={getScoreBadgeVariant(score)}>
              {score >= 80 ? '🟢 Bon' : score >= 60 ? '🟠 Moyen' : '🔴 Faible'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(row.original.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setSelectedPage(row.original);
                setDetailsOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Détails
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div
      ref={listRef}
      className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Statistiques */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Score Moyen</p>
                </div>
                <p
                  className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${getScoreColor(averageScore).includes('text-red') ? 'from-red-600 to-orange-600' : getScoreColor(averageScore).includes('text-orange') ? 'from-orange-600 to-yellow-600' : 'from-green-600 to-emerald-600'} bg-clip-text text-transparent`}
                >
                  {averageScore}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pages Optimisées</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {optimizedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">À Corriger</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {toFixCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Taux de Réussite</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {goodRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Mes Pages ({filteredData.length})</span>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-8 h-9 sm:h-10 text-xs sm:text-sm w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                <Search className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
              </div>
              <p className="text-sm sm:text-base text-foreground font-medium">
                Aucune page ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs sm:text-sm font-semibold">
                          Nom de la Page
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm font-semibold">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm font-semibold">
                          Score SEO
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm font-semibold">Niveau</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map(page => {
                        const score = page.analysis.score.overall;
                        return (
                          <TableRow key={page.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs sm:text-sm font-semibold">
                              {page.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {page.type === 'product' ? 'Produit' : 'Boutique'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Progress value={score} className="h-2 w-[80px]" />
                                <span
                                  className={`font-bold text-xs sm:text-sm ${getScoreColor(score)}`}
                                >
                                  {score}/100
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
                                {score >= 80 ? '🟢 Bon' : score >= 60 ? '🟠 Moyen' : '🔴 Faible'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(page.url, '_blank')}
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPage(page);
                                    setDetailsOpen(true);
                                  }}
                                  className="h-8 text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Détails
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3 sm:space-y-4">
                {filteredData.map(page => {
                  const score = page.analysis.score.overall;
                  return (
                    <Card
                      key={page.id}
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate mb-1">
                              {page.name}
                            </h3>
                            <Badge variant="outline" className="capitalize text-xs mb-2">
                              {page.type === 'product' ? 'Produit' : 'Boutique'}
                            </Badge>
                          </div>
                          <Select>
                            <SelectTrigger className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </SelectTrigger>
                            <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                              <SelectItem
                                value="view"
                                onSelect
                                onClick={() => window.open(page.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ouvrir
                              </SelectItem>
                              <SelectItem
                                value="export"
                                onSelect
                                onClick={() => {
                                  setSelectedPage(page);
                                  setDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Score SEO</p>
                            <div className="flex items-center gap-2">
                              <Progress value={score} className="h-2 w-20" />
                              <span className={`font-bold text-xs ${getScoreColor(score)}`}>
                                {score}/100
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Niveau</p>
                            <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
                              {score >= 80 ? '🟢 Bon' : score >= 60 ? '🟠 Moyen' : '🔴 Faible'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SEODetailDialog page={selectedPage} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
};

SEOPagesListComponent.displayName = 'SEOPagesListComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const SEOPagesList = React.memo(SEOPagesListComponent, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.data?.length === nextProps.data?.length &&
    // Comparaison superficielle des données (comparer les IDs)
    (!prevProps.data ||
      !nextProps.data ||
      prevProps.data.every(
        (page, index) =>
          page.id === nextProps.data?.[index]?.id &&
          page.analysis.score.overall === nextProps.data?.[index]?.analysis.score.overall
      ))
  );
});

SEOPagesList.displayName = 'SEOPagesList';
