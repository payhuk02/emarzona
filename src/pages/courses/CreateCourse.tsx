import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CreateCourseWizard } from "@/components/courses/create/CreateCourseWizard";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CreateCourse = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="mb-8">
              <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/dashboard/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux produits
                </Link>
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <GraduationCap className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Créer un nouveau cours</h1>
                  <p className="text-muted-foreground mt-1">
                    Suivez les étapes pour créer un cours professionnel en quelques minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Wizard */}
            <CreateCourseWizard />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateCourse;

