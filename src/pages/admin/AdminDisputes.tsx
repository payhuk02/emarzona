import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Clock, XCircle, User, Store, Shield, Calendar, MessageSquare, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, FileText, ExternalLink } from "lucide-react";
import { useDisputes, SortColumn, SortDirection } from "@/hooks/useDisputes";
import { Dispute, DisputeStatus, InitiatorType } from "@/types/advanced-features";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { exportDisputesToCSV } from "@/lib/export-utils";
import { Link } from "react-router-dom";

const AdminDisputes = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [initiatorFilter, setInitiatorFilter] = useState<InitiatorType | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortByColumn, setSortByColumn] = useState<SortColumn>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const pageSize = 20;
  
  // Débounce de la recherche pour éviter le spam de requêtes
  const debouncedSearch = useDebounce(searchInput, 500);
  
  // Mémoïser les filtres pour éviter les re-renders inutiles
  const filters = useMemo(() => ({
    ...(statusFilter !== "all" && { status: statusFilter as DisputeStatus }),
    ...(initiatorFilter !== "all" && { initiator_type: initiatorFilter as InitiatorType }),
    ...(priorityFilter !== "all" && { priority: priorityFilter }),
    ...(debouncedSearch.trim() && { search: debouncedSearch }),
  }), [statusFilter, initiatorFilter, priorityFilter, debouncedSearch]);

  const {
    disputes,
    stats,
    loading,
    error,
    totalCount,
    assignDispute,
    updateAdminNotes,
    resolveDispute,
    closeDispute,
    updateDisputeStatus,
    updateDisputePriority,
  } = useDisputes({ filters, page, pageSize, sortBy: sortByColumn, sortDirection: sortDir });

  // Fonction pour gérer le tri
  const handleSort = (column: SortColumn) => {
    if (sortByColumn === column) {
      // Toggle direction si même colonne
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, tri descendant par défaut
      setSortByColumn(column);
      setSortDir('desc');
    }
    setPage(1); // Reset à la page 1 lors du tri
  };

  // Fonction pour exporter les litiges en CSV
  const handleExportCSV = () => {
    try {
      if (disputes.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Il n'y a aucun litige à exporter",
          variant: "destructive",
        });
        return;
      }
      exportDisputesToCSV(disputes);
      toast({
        title: "Export réussi",
        description: `${disputes.length} litige(s) exporté(s) en CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"assign" | "notes" | "resolve" | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleOpenDialog = (dispute: Dispute, action: "assign" | "notes" | "resolve") => {
    setSelectedDispute(dispute);
    setActionType(action);
    
    if (action === "notes") {
      setInputValue(dispute.admin_notes || "");
    } else {
      setInputValue("");
    }
    
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedDispute) return;

    let success = false;

    if (actionType === "assign") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        success = await assignDispute(selectedDispute.id, user.id);
      }
    } else if (actionType === "notes") {
      success = await updateAdminNotes(selectedDispute.id, inputValue);
    } else if (actionType === "resolve") {
      if (!inputValue.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez fournir une résolution",
          variant: "destructive",
        });
        return;
      }
      success = await resolveDispute(selectedDispute.id, inputValue);
    }

    if (success) {
      setDialogOpen(false);
      setSelectedDispute(null);
      setInputValue("");
    }
  };

  const getStatusBadge = (status: DisputeStatus) => {
    const config: Record<DisputeStatus, { color: string; icon: any; label: string }> = {
      open: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, label: "Ouvert" },
      investigating: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock, label: "En investigation" },
      waiting_customer: { color: "bg-orange-100 text-orange-800 border-orange-300", icon: Clock, label: "Attente client" },
      waiting_seller: { color: "bg-purple-100 text-purple-800 border-purple-300", icon: Clock, label: "Attente vendeur" },
      resolved: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle, label: "Résolu" },
      closed: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: XCircle, label: "Fermé" },
    };

    const { color, icon: Icon, label } = config[status];

    return (
      <Badge className={`${color} border flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getInitiatorBadge = (type: InitiatorType) => {
    const config: Record<InitiatorType, { color: string; icon: any; label: string }> = {
      customer: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: User, label: "Client" },
      seller: { color: "bg-green-50 text-green-700 border-green-200", icon: Store, label: "Vendeur" },
      admin: { color: "bg-red-50 text-red-700 border-red-200", icon: Shield, label: "Admin" },
    };

    const { color, icon: Icon, label } = config[type];

    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Vérifier si un litige est nouveau (moins de 24h)
  const isNewDispute = (createdAt: string): boolean => {
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    return diffHours < 24;
  };

  // Badge de priorité coloré
  const getPriorityBadge = (priority?: string) => {
    const config: Record<string, { color: string; label: string; emoji: string }> = {
      urgent: { color: "bg-red-100 text-red-800 border-red-300", label: "Urgente", emoji: "🔴" },
      high: { color: "bg-orange-100 text-orange-800 border-orange-300", label: "Élevée", emoji: "🟠" },
      normal: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Normale", emoji: "🔵" },
      low: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Basse", emoji: "⚪" },
    };

    const priorityKey = priority || 'normal';
    const { color, label, emoji } = config[priorityKey] || config.normal;

    return (
      <Badge className={`${color} border text-xs`}>
        {emoji} {label}
      </Badge>
    );
  };

  // Composant pour les headers triables
  const SortableHeader = ({ column, label }: { column: SortColumn; label: string }) => {
    const isActive = sortByColumn === column;
    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none" 
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          <Icon className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </TableHead>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Erreur de chargement
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pour créer la table 'disputes', exécutez ce SQL dans Supabase SQL Editor :
                  </p>
                  <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                    <code className="text-xs">
                      {`-- Créer la table disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  initiator_type TEXT NOT NULL CHECK (initiator_type IN ('customer', 'seller', 'admin')),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'waiting_customer', 'waiting_seller', 'resolved', 'closed'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin ON disputes(assigned_admin_id);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Voir le fichier complet: supabase/migrations/20250124_disputes_system_complete.sql`}
                    </code>
                  </div>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Rafraîchir la page après migration
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Gestion des Litiges
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez et résolvez les litiges entre clients et vendeurs
                </p>
              </div>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={disputes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Ouverts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      En investigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-4 w-4 text-orange-600" />
                      Attente client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.waiting_customer}</div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Store className="h-4 w-4 text-purple-600" />
                      Attente vendeur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{stats.waiting_seller}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Résolus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters & Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recherche et filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par sujet, description ou ID commande..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1); // Reset to page 1 on search
                    }}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value as DisputeStatus | "all");
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="investigating">En investigation</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={initiatorFilter} onValueChange={(value) => {
                    setInitiatorFilter(value as InitiatorType | "all");
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Initiateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="customer">Client</SelectItem>
                      <SelectItem value="seller">Vendeur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={(value) => {
                    setPriorityFilter(value);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      <SelectItem value="urgent">🔴 Urgente</SelectItem>
                      <SelectItem value="high">🟠 Élevée</SelectItem>
                      <SelectItem value="normal">🔵 Normale</SelectItem>
                      <SelectItem value="low">🟢 Basse</SelectItem>
                    </SelectContent>
                  </Select>

                  {stats && stats.unassigned > 0 && (
                    <Badge variant="destructive" className="h-10 flex items-center">
                      {stats.unassigned} non assigné(s)
                    </Badge>
                  )}

                  {/* Reset Filters Button */}
                  {(statusFilter !== "all" || initiatorFilter !== "all" || priorityFilter !== "all" || searchInput.trim()) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter("all");
                        setInitiatorFilter("all");
                        setPriorityFilter("all");
                        setSearchInput("");
                        setPage(1);
                      }}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Disputes Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Litiges ({totalCount} total)</CardTitle>
                <CardDescription>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <span className="text-sm">Affichage {disputes.length} résultat(s) sur {totalCount}</span>
                    {stats?.avgResolutionTime && (
                      <>
                        <span className="hidden sm:inline text-muted-foreground">•</span>
                        <span className="text-sm">Temps moyen de résolution : {stats.avgResolutionTime}h</span>
                      </>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Aucun litige trouvé</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader column="order_id" label="Commande" />
                          <TableHead>Initiateur</TableHead>
                          <SortableHeader column="subject" label="Sujet" />
                          <TableHead>Priorité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Assigné à</TableHead>
                          <SortableHeader column="created_at" label="Date" />
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map((dispute) => (
                          <TableRow key={dispute.id} className={isNewDispute(dispute.created_at) ? "bg-yellow-50/30" : ""}>
                            <TableCell className="font-medium">
                              {dispute.order_id ? (
                                <div className="flex items-center gap-2">
                                  <Link 
                                    to={`/orders`}
                                    className="text-primary hover:underline flex items-center gap-1"
                                    title={`Voir la commande ${dispute.order_id}`}
                                  >
                                    {dispute.order_id.substring(0, 8)}
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                  {isNewDispute(dispute.created_at) && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800 border-yellow-300">
                                      NOUVEAU
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getInitiatorBadge(dispute.initiator_type)}
                                <span className="text-xs text-muted-foreground capitalize">
                                  {dispute.initiator_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium text-sm">{dispute.subject}</p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="w-full text-left">
                                      <p className="text-xs text-muted-foreground truncate cursor-help">
                                        {dispute.description}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-md">
                                      <p className="text-sm whitespace-normal">{dispute.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={dispute.priority || 'normal'}
                                onValueChange={(value) => updateDisputePriority(dispute.id, value as any)}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">⚪ Basse</SelectItem>
                                  <SelectItem value="normal">🔵 Normale</SelectItem>
                                  <SelectItem value="high">🟠 Élevée</SelectItem>
                                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={dispute.status}
                                onValueChange={(value) => updateDisputeStatus(dispute.id, value as DisputeStatus)}
                              >
                                <SelectTrigger className="w-[160px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">⚠️ Ouvert</SelectItem>
                                  <SelectItem value="investigating">🔍 En investigation</SelectItem>
                                  <SelectItem value="waiting_customer">⏳ Attente client</SelectItem>
                                  <SelectItem value="waiting_seller">⏳ Attente vendeur</SelectItem>
                                  <SelectItem value="resolved">✅ Résolu</SelectItem>
                                  <SelectItem value="closed">❌ Fermé</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {dispute.assigned_admin_id ? (
                                <div className="flex items-center gap-1">
                                  <Shield className="h-3 w-3 text-primary" />
                                  <span className="text-sm">Admin assigné</span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">Non assigné</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(dispute.created_at), "dd MMM yyyy", { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedDispute(dispute);
                                    setDetailsDialogOpen(true);
                                  }}
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!dispute.assigned_admin_id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDialog(dispute, "assign")}
                                  >
                                    M'assigner
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDialog(dispute, "notes")}
                                >
                                  Notes
                                  </Button>
                                {dispute.status !== "resolved" && dispute.status !== "closed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenDialog(dispute, "resolve")}
                                  >
                                    Résoudre
                                  </Button>
                                )}
                                {dispute.status === "resolved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => closeDispute(dispute.id)}
                                  >
                                    Fermer
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {totalCount > pageSize && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {page} sur {Math.ceil(totalCount / pageSize)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                          .filter(p => {
                            // Afficher 1-2-3...current-1-current-current+1...last-1-last
                            return p === 1 || p === Math.ceil(totalCount / pageSize) || Math.abs(p - page) <= 1;
                          })
                          .map((p, idx, arr) => (
                            <div key={p} className="flex items-center">
                              {idx > 0 && arr[idx - 1] !== p - 1 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={p === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="min-w-[2rem]"
                              >
                                {p}
                              </Button>
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails du litige
            </DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Statut et Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(selectedDispute.status)}
                {getInitiatorBadge(selectedDispute.initiator_type)}
                {selectedDispute.assigned_admin_id && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Assigné
                  </Badge>
                )}
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID Litige:</span>
                      <p className="font-mono">{selectedDispute.id.substring(0, 13)}...</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID Commande:</span>
                      <p className="font-mono">{selectedDispute.order_id ? selectedDispute.order_id.substring(0, 13) + '...' : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date de création:</span>
                      <p>{format(new Date(selectedDispute.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                    </div>
                    {selectedDispute.resolved_at && (
                      <div>
                        <span className="text-muted-foreground">Date de résolution:</span>
                        <p>{format(new Date(selectedDispute.resolved_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Priorité et responsabilité</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Priorité:</span>
                      <p className="capitalize">{selectedDispute.priority || 'Normale'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Initiateur:</span>
                      <p className="capitalize">{selectedDispute.initiator_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigné à:</span>
                      <p>{selectedDispute.assigned_admin_id ? 'Admin assigné' : 'Non assigné'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sujet et Description */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Sujet</h3>
                <p className="text-base">{selectedDispute.subject}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Résolution */}
              {selectedDispute.resolution && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-green-600">Résolution</h3>
                  <p className="text-sm whitespace-pre-wrap bg-green-50 border border-green-200 p-4 rounded-lg">
                    {selectedDispute.resolution}
                  </p>
                </div>
              )}

              {/* Notes admin */}
              {selectedDispute.admin_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Notes administrateur</h3>
                  <p className="text-sm whitespace-pre-wrap bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    {selectedDispute.admin_notes}
                  </p>
                </div>
              )}

              {/* Actions rapides */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                {!selectedDispute.assigned_admin_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await assignDispute(selectedDispute.id, user.id);
                        setDetailsDialogOpen(false);
                      }
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    M'assigner
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleOpenDialog(selectedDispute, "notes");
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Modifier notes
                </Button>
                {selectedDispute.status !== "resolved" && selectedDispute.status !== "closed" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleOpenDialog(selectedDispute, "resolve");
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Résoudre
                  </Button>
                )}
                {selectedDispute.status === "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await closeDispute(selectedDispute.id);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "assign" && "Assigner le litige"}
              {actionType === "notes" && "Notes d'administration"}
              {actionType === "resolve" && "Résoudre le litige"}
            </DialogTitle>
            <DialogDescription>
              {selectedDispute && (
                <div className="mt-2 space-y-2">
                  <p><strong>Commande :</strong> {selectedDispute.order_id.substring(0, 13)}...</p>
                  <p><strong>Sujet :</strong> {selectedDispute.subject}</p>
                  <p><strong>Description :</strong> {selectedDispute.description}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === "assign" && (
            <div className="py-4">
              <p>Voulez-vous vous assigner ce litige ?</p>
              <p className="text-sm text-muted-foreground mt-2">
                Le statut passera automatiquement à "En investigation"
              </p>
            </div>
          )}

          {actionType === "notes" && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Notes internes (admin uniquement)</label>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ajoutez vos notes ici..."
                rows={6}
              />
            </div>
          )}

          {actionType === "resolve" && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Résolution du litige *</label>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Décrivez la solution apportée au litige..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Cette résolution sera visible par le client et le vendeur
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAction}>
              {actionType === "assign" && "Assigner"}
              {actionType === "notes" && "Enregistrer"}
              {actionType === "resolve" && "Résoudre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDisputes;

