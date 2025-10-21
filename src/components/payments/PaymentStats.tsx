import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Users
} from "lucide-react";
import { Payment } from "@/hooks/usePayments";
import { Transaction } from "@/hooks/useTransactions";

interface PaymentStatsProps {
  payments: Payment[];
  filteredPayments: Payment[];
  transactions: Transaction[];
}

const PaymentStats = ({ payments, filteredPayments, transactions }: PaymentStatsProps) => {
  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;
  const refundedPayments = payments.filter(p => p.status === 'refunded').length;
  
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = completedPayments > 0 ? totalRevenue / completedPayments : 0;
  
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;
  
  const transactionRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  
  // Méthodes de paiement les plus utilisées
  const paymentMethods = payments.reduce((acc, payment) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMethod = Object.entries(paymentMethods).sort(([,a], [,b]) => b - a)[0];

  // Statistiques par période
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayPayments = payments.filter(p => new Date(p.created_at) >= yesterday).length;
  const weekPayments = payments.filter(p => new Date(p.created_at) >= lastWeek).length;
  const monthPayments = payments.filter(p => new Date(p.created_at) >= lastMonth).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paiements totaux</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayments}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {completedPayments} complétés
            </Badge>
            <Badge variant="outline" className="text-xs">
              {pendingPayments} en attente
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} FCFA</div>
          <p className="text-xs text-muted-foreground mt-1">
            Moyenne: {averagePayment.toLocaleString()} FCFA
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">
              {completedTransactions} réussies
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Méthode populaire</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topMethod ? topMethod[0] : "Aucune"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {topMethod ? `${topMethod[1]} paiement${topMethod[1] > 1 ? "s" : ""}` : "Pas de données"}
          </p>
        </CardContent>
      </Card>

      {/* Cartes supplémentaires pour plus de détails */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayPayments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Paiements aujourd'hui
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{weekPayments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Paiements cette semaine
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthPayments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Paiements ce mois
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paiements réussis
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStats;
