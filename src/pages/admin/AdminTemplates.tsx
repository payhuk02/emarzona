import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout, Plus, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function AdminTemplates() {
  // Mock data
  const templates = [
    {
      id: "1",
      name: "E-book Premium",
      type: "digital",
      status: "approved",
      usage: 145,
      author: "Payhuk Team",
    },
    {
      id: "2",
      name: "Fashion Apparel",
      type: "physical",
      status: "pending",
      usage: 23,
      author: "Community",
    },
    {
      id: "3",
      name: "Business Consulting",
      type: "service",
      status: "approved",
      usage: 89,
      author: "Payhuk Team",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Layout className="h-8 w-8 text-primary" />
                  Gestion des Templates
                </h1>
                <p className="text-muted-foreground mt-1">
                  Administrez tous les templates de la plateforme
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Template
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templates.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Approuvés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter((t) => t.status === "approved").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En Attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter((t) => t.status === "pending").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Utilisation Totale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.reduce((acc, t) => acc + t.usage, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates List */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Templates</CardTitle>
                <CardDescription>
                  Gérez, modérez et analysez les templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Layout className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Par {template.author} • {template.usage} utilisations
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            template.status === "approved" ? "default" : "secondary"
                          }
                        >
                          {template.status === "approved" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {template.status}
                        </Badge>
                        <Badge variant="outline">{template.type}</Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

