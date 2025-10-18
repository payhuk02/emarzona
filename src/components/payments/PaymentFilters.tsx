import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PaymentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (value: string) => void;
}

export const PaymentFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
}: PaymentFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par transaction, notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="completed">Complété</SelectItem>
          <SelectItem value="failed">Échoué</SelectItem>
          <SelectItem value="refunded">Remboursé</SelectItem>
        </SelectContent>
      </Select>

      <Select value={methodFilter} onValueChange={onMethodChange}>
        <SelectTrigger>
          <SelectValue placeholder="Toutes les méthodes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les méthodes</SelectItem>
          <SelectItem value="cash">Espèces</SelectItem>
          <SelectItem value="card">Carte bancaire</SelectItem>
          <SelectItem value="mobile_money">Mobile Money</SelectItem>
          <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
          <SelectItem value="check">Chèque</SelectItem>
          <SelectItem value="other">Autre</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
