/**
 * Admin Support Dashboard
 * Gestion des tickets de support
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Headphones,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
} from 'lucide-react';

export default function AdminSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Mock data - À remplacer par vraies données
  const mockTickets = useMemo(() => [
    {
      id: '1',
      ticket_number: 'TICKET-001',
      user_name: 'Jean Dupont',
      user_email: 'jean@example.com',
      subject: 'Problème de paiement',
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString(),
      messages_count: 3,
    },
    {
      id: '2',
      ticket_number: 'TICKET-002',
      user_name: 'Marie Martin',
      user_email: 'marie@example.com',
      subject: 'Question sur livraison',
      status: 'pending',
      priority: 'medium',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      messages_count: 5,
    },
  ], []);

  useEffect(() => {
    logger.info('Admin Support page chargée');
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default"><AlertCircle className="h-3 w-3 mr-1" /> Ouvert</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'resolved':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" /> Résolu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Haute</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div ref={headerRef} className="flex items-center justify-between" role="banner">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" id="admin-support-title">Support Client</h1>
                <p className="text-muted-foreground">
                  Gérez les tickets de support des utilisateurs
                </p>
              </div>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Nouveau Ticket
              </Button>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-4" role="region" aria-label="Statistiques des tickets">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTickets.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {mockTickets.filter(t => t.status === 'open').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {mockTickets.filter(t => t.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {mockTickets.filter(t => t.status === 'resolved').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Table */}
            <div ref={tableRef} role="region" aria-label="Tableau des tickets">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="open">Ouverts</TabsTrigger>
                      <TabsTrigger value="pending">En attente</TabsTrigger>
                      <TabsTrigger value="resolved">Résolus</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Ticket</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.user_name}</div>
                            <div className="text-sm text-muted-foreground">{ticket.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {ticket.messages_count}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

