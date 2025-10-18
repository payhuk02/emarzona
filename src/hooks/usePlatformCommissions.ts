import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlatformCommission {
  id: string;
  payment_id: string | null;
  store_id: string;
  order_id: string | null;
  product_id: string | null;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  seller_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
    slug: string;
  };
}

export interface CommissionStats {
  totalCommissions: number;
  totalSales: number;
  averageCommission: number;
  salesCount: number;
}

export const usePlatformCommissions = (startDate?: string, endDate?: string) => {
  const [commissions, setCommissions] = useState<PlatformCommission[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    totalSales: 0,
    averageCommission: 0,
    salesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("platform_commissions")
        .select(`
          *,
          stores!fk_platform_commissions_store (name, slug)
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCommissions(data || []);

      // Calculer les statistiques
      if (data && data.length > 0) {
        const totalCommissions = data.reduce(
          (sum, c) => sum + Number(c.commission_amount),
          0
        );
        const totalSales = data.reduce(
          (sum, c) => sum + Number(c.total_amount),
          0
        );
        const salesCount = data.length;
        const averageCommission = totalCommissions / salesCount;

        setStats({
          totalCommissions,
          totalSales,
          averageCommission,
          salesCount,
        });
      } else {
        setStats({
          totalCommissions: 0,
          totalSales: 0,
          averageCommission: 0,
          salesCount: 0,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [startDate, endDate]);

  const exportToCSV = () => {
    if (commissions.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a pas de commissions à exporter",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Date",
      "Boutique",
      "Montant Total",
      "Commission (10%)",
      "Reversement Vendeur",
      "Statut",
    ];

    const csvData = commissions.map((c) => [
      new Date(c.created_at).toLocaleDateString("fr-FR"),
      c.stores?.name || "N/A",
      `${c.total_amount} XOF`,
      `${c.commission_amount} XOF`,
      `${c.seller_amount} XOF`,
      c.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `commissions_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: "Les données ont été exportées en CSV",
    });
  };

  return {
    commissions,
    stats,
    loading,
    refetch: fetchCommissions,
    exportToCSV,
  };
};
