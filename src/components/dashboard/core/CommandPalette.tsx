import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  ShoppingCart,
  Box,
  Settings,
  Users,
  CreditCard,
  BarChart,
  Activity,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Tapez une commande ou cherchez..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Tableau de bord</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/orders'))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Commandes</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/analytics'))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Analytiques Globales</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Logistique & Produits">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/physical-products'))}>
            <Box className="mr-2 h-4 w-4" />
            <span>Produits Physiques</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/inventory'))}>
            <BarChart className="mr-2 h-4 w-4" />
            <span>Analytiques Inventaire</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configuration">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Facturation & Paiements</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
