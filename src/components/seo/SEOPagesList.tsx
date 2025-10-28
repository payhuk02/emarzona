"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOPageData } from "@/hooks/useSEOAnalysis";
import { getScoreBadgeVariant, getScoreColor } from "@/lib/seo-analyzer";
import {
  Eye,
  ExternalLink,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SEODetailDialog } from "./SEODetailDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

import Papa from "papaparse";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SEOPagesListProps {
  data: SEOPageData[] | undefined;
  isLoading: boolean;
}

export const SEOPagesList = ({ data, isLoading }: SEOPagesListProps) => {
  const [selectedPage, setSelectedPage] = useState<SEOPageData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((page) => {
      const matchType = typeFilter === "all" || page.type === typeFilter;
      const matchSearch =
        page.name.toLowerCase().includes(search.toLowerCase()) ||
        page.url.toLowerCase().includes(search.toLowerCase());
      const score = page.analysis.score.overall;
      const matchScore =
        scoreFilter === "all" ||
        (scoreFilter === "good" && score >= 80) ||
        (scoreFilter === "medium" && score >= 60 && score < 80) ||
        (scoreFilter === "bad" && score < 60);
      return matchType && matchSearch && matchScore;
    });
  }, [data, typeFilter, scoreFilter, search]);

  const averageScore = useMemo(() => {
    if (!filteredData.length) return 0;
    const total = filteredData.reduce(
      (acc, page) => acc + page.analysis.score.overall,
      0
    );
    return Math.round(total / filteredData.length);
  }, [filteredData]);

  const optimizedCount = useMemo(
    () => filteredData.filter((p) => p.analysis.score.overall >= 80).length,
    [filteredData]
  );

  const toFixCount = useMemo(
    () => filteredData.filter((p) => p.analysis.score.overall < 70).length,
    [filteredData]
  );

  const goodRate = useMemo(() => {
    if (!filteredData.length) return 0;
    return Math.round((optimizedCount / filteredData.length) * 100);
  }, [filteredData, optimizedCount]);

  const columns = useMemo<ColumnDef<SEOPageData>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nom de la Page",
        cell: ({ row }) => (
          <div className="font-semibold text-sm break-words max-w-[200px]">
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type === "product" ? "Produit" : "Boutique"}
          </Badge>
        ),
      },
      {
        accessorKey: "score",
        header: "Score SEO",
        cell: ({ row }) => {
          const score = row.original.analysis.score.overall;
          return (
            <div className="flex items-center gap-3">
              <Progress value={score} className="h-2 w-[80px]" />
              <span className={`font-bold text-sm ${getScoreColor(score)}`}>
                {score}/100
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "niveau",
        header: "Niveau",
        cell: ({ row }) => {
          const score = row.original.analysis.score.overall;
          return (
            <Badge variant={getScoreBadgeVariant(score)}>
              {score >= 80 ? "🟢 Bon" : score >= 60 ? "🟠 Moyen" : "🔴 Faible"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(row.original.url, "_blank")}
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
    <>
      {/* Statistiques */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card className="border-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Moyen
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}/100
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Pages Optimisées
            </div>
            <div className="text-2xl font-bold text-green-600">
              {optimizedCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              À Corriger
            </div>
            <div className="text-2xl font-bold text-orange-600">{toFixCount}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Taux de Réussite
            </div>
            <div className="text-2xl font-bold text-blue-600">{goodRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Mes Pages ({filteredData.length})</span>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[150px] sm:w-[200px]"
              />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune page ne correspond à votre recherche.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <SEODetailDialog
        page={selectedPage}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
