import { useStore } from "@/hooks/use-store";
import StoreForm from "@/components/store/StoreForm";

export const StoreSettings = () => {
  const { store, loading } = useStore();

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (!store) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Vous n'avez pas encore de boutique. Créez-en une depuis la page "Ma boutique".
      </div>
    );
  }

  return (
    <StoreForm
      initialData={{
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        default_currency: store.default_currency,
      }}
      onSuccess={() => {}}
    />
  );
};
