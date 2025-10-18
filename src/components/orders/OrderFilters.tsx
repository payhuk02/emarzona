import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (value: string) => void;
}

export const OrderFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
}: OrderFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par n° de commande ou client..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="processing">En cours</SelectItem>
          <SelectItem value="completed">Terminée</SelectItem>
          <SelectItem value="cancelled">Annulée</SelectItem>
        </SelectContent>
      </Select>

      <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Paiement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les paiements</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="paid">Payée</SelectItem>
          <SelectItem value="failed">Échouée</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
