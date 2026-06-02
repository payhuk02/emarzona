/**
 * Hub outils avancés (P3) — modules hors sidebar principale
 */

import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ADMIN_ADVANCED_TOOL_CATEGORIES } from '@/lib/admin/admin-advanced-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ExternalLink } from 'lucide-react';

export default function AdminAdvancedTools() {
  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-primary" aria-hidden />
            Outils avancés
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Accès rapide aux modules spécialisés (IA, WMS, notifications) qui ne figurent pas dans
            le menu admin standard.
          </p>
        </div>

        {ADMIN_ADVANCED_TOOL_CATEGORIES.map(category => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map(tool => {
                  const Icon = tool.icon;
                  const isAdmin = tool.scope === 'admin';
                  return (
                    <li
                      key={tool.path}
                      className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-sm">{tool.label}</span>
                        </div>
                        <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px]">
                          {isAdmin ? 'Admin' : 'Vendeur'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex-1">{tool.description}</p>
                      <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
                        <Link to={tool.path}>
                          Ouvrir
                          {!isAdmin && <ExternalLink className="h-3 w-3 ml-1" />}
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
