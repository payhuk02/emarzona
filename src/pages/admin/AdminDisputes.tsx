import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Clock, XCircle, User, Store, Shield, Calendar, MessageSquare } from "lucide-react";
import { useDisputes } from "@/hooks/useDisputes";
import { Dispute, DisputeStatus, InitiatorType } from "@/types/advanced-features";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDisputes = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [initiatorFilter, setInitiatorFilter] = useState<InitiatorType | "all">("all");
  
  const filters = {
    ...(statusFilter !== "all" && { status: statusFilter as DisputeStatus }),
    ...(initiatorFilter !== "all" && { initiator_type: initiatorFilter as InitiatorType }),
  };

  const {
    disputes,
    stats,
    loading,
    error,
    assignDispute,
    updateAdminNotes,
    resolveDispute,
    closeDispute,
    updateDisputeStatus,
  } = useDisputes(filters);

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    const config = {
      open: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, label: "Ouvert" },
      investigating: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock, label: "En investigation" },
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
    const config = {
      customer: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: User, label: "Client" },
      store: { color: "bg-green-50 text-green-700 border-green-200", icon: Store, label: "Vendeur" },
    };

    const { color, icon: Icon, label } = config[type];

    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
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
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Voir le fichier: supabase/migrations/20250124_disputes_system_complete.sql`}
                    </code>
                  </div>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Rafraîchir la page après migration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Gestion des Litiges
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez et résolvez les litiges entre clients et vendeurs
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtres</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DisputeStatus | "all")}>
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

                <Select value={initiatorFilter} onValueChange={(value) => setInitiatorFilter(value as InitiatorType | "all")}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Initiateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="store">Vendeur</SelectItem>
                  </SelectContent>
                </Select>

                {stats && stats.unassigned > 0 && (
                  <Badge variant="destructive" className="h-10 flex items-center">
                    {stats.unassigned} non assigné(s)
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Disputes Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Litiges ({disputes.length})</CardTitle>
                <CardDescription>
                  {stats?.avgResolutionTime && (
                    <span className="text-sm">Temps moyen de résolution : {stats.avgResolutionTime}h</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          <TableHead>Commande</TableHead>
                          <TableHead>Initiateur</TableHead>
                          <TableHead>Raison</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Assigné à</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map((dispute) => (
                          <TableRow key={dispute.id}>
                            <TableCell className="font-medium">
                              {dispute.order?.order_number || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getInitiatorBadge(dispute.initiator_type)}
                                <span className="text-xs text-muted-foreground">
                                  {dispute.initiator?.name || "N/A"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium text-sm">{dispute.reason}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {dispute.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(dispute.status)}</TableCell>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

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
                  <p><strong>Commande :</strong> {selectedDispute.order?.order_number}</p>
                  <p><strong>Raison :</strong> {selectedDispute.reason}</p>
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
    </SidebarProvider>
  );
};

export default AdminDisputes;

