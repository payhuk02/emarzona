import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layout,
  Package,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Download,
  Trash2,
  Share2,
  Eye,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyTemplates() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>("all");

  // Templates sauvegardés (exemple - à connecter avec DB)
  const savedTemplates = [
    {
      id: "1",
      name: "E-book Premium",
      type: "digital",
      category: "E-book",
      savedAt: "2025-10-25",
      usageCount: 3,
    },
    {
      id: "2",
      name: "Fashion Apparel",
      type: "physical",
      category: "Vêtements",
      savedAt: "2025-10-28",
      usageCount: 1,
    },
    {
      id: "3",
      name: "Business Consulting",
      type: "service",
      category: "Consulting",
      savedAt: "2025-10-20",
      usageCount: 5,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "digital":
        return <Download className="h-4 w-4" />;
      case "physical":
        return <Package className="h-4 w-4" />;
      case "service":
        return <Briefcase className="h-4 w-4" />;
      case "course":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "digital":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "physical":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "service":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "course":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const filteredTemplates =
    selectedType === "all"
      ? savedTemplates
      : savedTemplates.filter((t) => t.type === selectedType);

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
                  <Sparkles className="h-8 w-8 text-primary" />
                  Mes Templates
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos templates sauvegardés pour créer rapidement des produits
                </p>
              </div>
              <Button onClick={() => navigate("/demo/templates-ui")}>
                <Layout className="h-4 w-4 mr-2" />
                Marketplace Templates
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sauvegardés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{savedTemplates.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Digitaux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {savedTemplates.filter((t) => t.type === "digital").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Physiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {savedTemplates.filter((t) => t.type === "physical").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {savedTemplates.filter((t) => t.type === "service").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="digital">Digitaux</TabsTrigger>
                <TabsTrigger value="physical">Physiques</TabsTrigger>
                <TabsTrigger value="service">Services</TabsTrigger>
                <TabsTrigger value="course">Cours</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedType} className="mt-6">
                {filteredTemplates.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Aucun template sauvegardé dans cette catégorie
                      </p>
                      <Button
                        onClick={() => navigate("/demo/templates-ui")}
                        variant="outline"
                        className="mt-4"
                      >
                        Explorer les Templates
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(template.type)}
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                            </div>
                            <Badge
                              variant="outline"
                              className={getTypeColor(template.type)}
                            >
                              {template.type}
                            </Badge>
                          </div>
                          <CardDescription>{template.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Utilisé {template.usageCount} fois</span>
                            <span>{new Date(template.savedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => navigate("/dashboard/products/new")}
                              size="sm"
                              className="flex-1"
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Utiliser
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

