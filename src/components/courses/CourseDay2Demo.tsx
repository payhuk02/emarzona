/**
 * 🧪 DEMO - JOUR 2 - Composants Courses
 * 
 * Ce fichier démontre l'utilisation des composants :
 * 1. CoursesList
 * 2. CoursePackageManager
 * 
 * Date : 29 Octobre 2025
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoursesList, type CourseListItem } from './CoursesList';
import { CoursePackageManager, type CoursePackage } from './CoursePackageManager';

// Données de test - Cours
const sampleCourses: CourseListItem[] = [
  {
    id: 'CRS-001',
    name: 'React & TypeScript Avancé',
    instructor: 'Sarah Martin',
    status: 'published',
    category: 'development',
    price: 149,
    currency: 'EUR',
    enrolledStudents: 85,
    maxStudents: 100,
    completionRate: 67,
    revenue: 12665,
    duration: 25,
    totalLessons: 42,
    createdAt: new Date('2024-08-15'),
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300',
  },
  {
    id: 'CRS-002',
    name: 'Node.js & Express API',
    instructor: 'David Laurent',
    status: 'published',
    category: 'development',
    price: 99,
    currency: 'EUR',
    enrolledStudents: 120,
    maxStudents: 150,
    completionRate: 78,
    revenue: 11880,
    duration: 18,
    totalLessons: 32,
    createdAt: new Date('2024-07-20'),
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300',
  },
  {
    id: 'CRS-003',
    name: 'Python pour Data Science',
    instructor: 'Sophie Bernard',
    status: 'published',
    category: 'data_science',
    price: 199,
    currency: 'EUR',
    enrolledStudents: 67,
    maxStudents: 80,
    completionRate: 82,
    revenue: 13333,
    duration: 30,
    totalLessons: 56,
    createdAt: new Date('2024-06-10'),
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300',
  },
  {
    id: 'CRS-004',
    name: 'UI/UX Design Masterclass',
    instructor: 'Emma Wilson',
    status: 'published',
    category: 'design',
    price: 129,
    currency: 'EUR',
    enrolledStudents: 92,
    maxStudents: 100,
    completionRate: 71,
    revenue: 11868,
    duration: 22,
    totalLessons: 38,
    createdAt: new Date('2024-09-01'),
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300',
  },
  {
    id: 'CRS-005',
    name: 'Vue.js 3 Complet',
    instructor: 'Luc Moreau',
    status: 'in_progress',
    category: 'development',
    price: 89,
    currency: 'EUR',
    enrolledStudents: 45,
    maxStudents: 60,
    completionRate: 55,
    revenue: 4005,
    duration: 16,
    totalLessons: 28,
    createdAt: new Date('2024-09-15'),
    thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=300',
  },
  {
    id: 'CRS-006',
    name: 'Marketing Digital Stratégique',
    instructor: 'Claire Dubois',
    status: 'published',
    category: 'marketing',
    price: 119,
    currency: 'EUR',
    enrolledStudents: 78,
    maxStudents: 100,
    completionRate: 88,
    revenue: 9282,
    duration: 20,
    totalLessons: 35,
    createdAt: new Date('2024-08-01'),
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
  },
  {
    id: 'CRS-007',
    name: 'Développement Personnel Pro',
    instructor: 'Marc Traoré',
    status: 'draft',
    category: 'personal_development',
    price: 79,
    currency: 'EUR',
    enrolledStudents: 0,
    maxStudents: 50,
    completionRate: 0,
    revenue: 0,
    duration: 12,
    totalLessons: 20,
    createdAt: new Date('2024-10-20'),
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300',
  },
  {
    id: 'CRS-008',
    name: 'DevOps & Docker',
    instructor: 'Thomas Petit',
    status: 'archived',
    category: 'development',
    price: 179,
    currency: 'EUR',
    enrolledStudents: 156,
    maxStudents: 200,
    completionRate: 94,
    revenue: 27924,
    duration: 28,
    totalLessons: 48,
    createdAt: new Date('2024-05-01'),
    thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=300',
  },
];

// Données de test - Packages
const samplePackages: CoursePackage[] = [
  {
    id: 'PKG-001',
    name: 'Pack Full-Stack Developer',
    description: 'Devenez développeur full-stack avec React, Node.js et TypeScript',
    type: 'bundle',
    courses: [
      {
        id: 'CRS-001',
        name: 'React & TypeScript Avancé',
        price: 149,
        duration: 25,
        isRequired: true,
        order: 1,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300',
      },
      {
        id: 'CRS-002',
        name: 'Node.js & Express API',
        price: 99,
        duration: 18,
        isRequired: true,
        order: 2,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300',
      },
    ],
    tiers: [
      {
        id: 'tier-1',
        name: 'Basic',
        description: 'Accès aux cours de base',
        price: 199,
        discount: 49,
        discountType: 'fixed_amount',
        features: ['2 cours', 'Accès à vie', 'Support par email'],
        isPopular: false,
      },
      {
        id: 'tier-2',
        name: 'Premium',
        description: 'Tout inclus avec mentorat',
        price: 249,
        discount: 20,
        discountType: 'percentage',
        features: ['2 cours', 'Accès à vie', 'Support prioritaire', 'Mentorat 1-1'],
        isPopular: true,
      },
    ],
    totalValue: 248,
    discountPercentage: 20,
    isActive: true,
    enrolledStudents: 42,
    revenue: 8358,
    currency: 'EUR',
    createdAt: new Date('2024-09-01'),
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300',
  },
  {
    id: 'PKG-002',
    name: 'Parcours Data Scientist',
    description: 'Formation complète en Data Science avec Python',
    type: 'learning_path',
    courses: [
      {
        id: 'CRS-003',
        name: 'Python pour Data Science',
        price: 199,
        duration: 30,
        isRequired: true,
        order: 1,
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300',
      },
    ],
    tiers: [
      {
        id: 'tier-3',
        name: 'Standard',
        description: 'Formation complète',
        price: 179,
        discount: 10,
        discountType: 'percentage',
        features: ['Cours complet', 'Projets pratiques', 'Certificat'],
        isPopular: true,
      },
    ],
    totalValue: 199,
    discountPercentage: 10,
    isActive: true,
    enrolledStudents: 28,
    revenue: 5012,
    currency: 'EUR',
    validityPeriod: 365,
    createdAt: new Date('2024-08-15'),
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300',
  },
  {
    id: 'PKG-003',
    name: 'Abonnement Designer Pro',
    description: 'Accès illimité à tous les cours de design',
    type: 'subscription',
    courses: [
      {
        id: 'CRS-004',
        name: 'UI/UX Design Masterclass',
        price: 129,
        duration: 22,
        isRequired: false,
        order: 1,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300',
      },
    ],
    tiers: [
      {
        id: 'tier-4',
        name: 'Mensuel',
        description: 'Abonnement mensuel',
        price: 49,
        discount: 0,
        discountType: 'percentage',
        features: ['Tous les cours design', 'Nouveaux cours chaque mois', 'Annulation facile'],
        isPopular: false,
      },
      {
        id: 'tier-5',
        name: 'Annuel',
        description: 'Meilleur rapport qualité/prix',
        price: 399,
        discount: 32,
        discountType: 'percentage',
        features: ['Tous les cours design', 'Nouveaux cours chaque mois', '2 mois gratuits'],
        isPopular: true,
      },
    ],
    totalValue: 129,
    discountPercentage: 0,
    isActive: true,
    enrolledStudents: 67,
    revenue: 14532,
    currency: 'EUR',
    validityPeriod: 30,
    createdAt: new Date('2024-07-01'),
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300',
  },
];

/**
 * Composant de démonstration principale
 */
export const CourseDay2Demo: React.FC = () => {
  const [courses] = useState<CourseListItem[]>(sampleCourses);
  const [packages, setPackages] = useState<CoursePackage[]>(samplePackages);

  // Handlers pour CoursesList
  const handleCourseSelect = (courseId: string) => {
    console.log('Course selected:', courseId);
    alert(`Cours sélectionné: ${courseId}`);
  };

  const handleEdit = (courseId: string) => {
    console.log('Edit course:', courseId);
    alert(`Éditer le cours: ${courseId}`);
  };

  const handleDelete = (courseId: string) => {
    console.log('Delete course:', courseId);
    if (confirm(`Supprimer le cours ${courseId} ?`)) {
      alert('Cours supprimé (demo)');
    }
  };

  const handleBulkAction = (action: string, courseIds: string[]) => {
    console.log('Bulk action:', action, courseIds);
    alert(`Action groupée: ${action} sur ${courseIds.length} cours`);
  };

  // Handlers pour CoursePackageManager
  const handleCreatePackage = (packageData: Partial<CoursePackage>) => {
    console.log('Create package:', packageData);
    const newPackage: CoursePackage = {
      id: `PKG-${Date.now()}`,
      name: packageData.name || '',
      description: packageData.description || '',
      type: packageData.type || 'bundle',
      courses: packageData.courses || [],
      tiers: packageData.tiers || [],
      totalValue: 0,
      discountPercentage: 0,
      isActive: true,
      enrolledStudents: 0,
      revenue: 0,
      currency: packageData.currency || 'EUR',
      createdAt: new Date(),
    };
    setPackages([...packages, newPackage]);
    alert('Package créé !');
  };

  const handleUpdatePackage = (packageId: string, packageData: Partial<CoursePackage>) => {
    console.log('Update package:', packageId, packageData);
    setPackages(packages.map(pkg => pkg.id === packageId ? { ...pkg, ...packageData } : pkg));
    alert(`Package ${packageId} mis à jour !`);
  };

  const handleDeletePackage = (packageId: string) => {
    console.log('Delete package:', packageId);
    if (confirm(`Supprimer le package ${packageId} ?`)) {
      setPackages(packages.filter(pkg => pkg.id !== packageId));
      alert('Package supprimé !');
    }
  };

  const handleDuplicatePackage = (packageId: string) => {
    console.log('Duplicate package:', packageId);
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      const newPackage: CoursePackage = {
        ...pkg,
        id: `PKG-${Date.now()}`,
        name: `${pkg.name} (Copie)`,
        enrolledStudents: 0,
        revenue: 0,
        createdAt: new Date(),
      };
      setPackages([...packages, newPackage]);
      alert('Package dupliqué !');
    }
  };

  const handleTogglePackageActive = (packageId: string, isActive: boolean) => {
    console.log('Toggle package active:', packageId, isActive);
    setPackages(packages.map(pkg => pkg.id === packageId ? { ...pkg, isActive } : pkg));
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          🎓 Démonstration - Composants Courses Jour 2
        </h1>
        <p className="text-muted-foreground">
          CoursesList & CoursePackageManager - Gestion complète
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="courses-list" className="space-y-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="courses-list">CoursesList</TabsTrigger>
          <TabsTrigger value="package-manager">PackageManager</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: CoursesList ==================== */}
        <TabsContent value="courses-list" className="space-y-6">
          <CoursesList
            courses={courses}
            onCourseSelect={handleCourseSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={(id) => alert(`Dupliquer: ${id}`)}
            onArchive={(id) => alert(`Archiver: ${id}`)}
            onTogglePublish={(id, status) => alert(`Toggle publish: ${id} → ${status}`)}
            onBulkAction={handleBulkAction}
            showFilters={true}
            showPagination={true}
            itemsPerPage={5}
          />
        </TabsContent>

        {/* ==================== TAB 2: CoursePackageManager ==================== */}
        <TabsContent value="package-manager" className="space-y-6">
          <CoursePackageManager
            packages={packages}
            availableCourses={courses.map(c => ({
              id: c.id,
              name: c.name,
              price: c.price,
              duration: c.duration,
              thumbnail: c.thumbnail,
            }))}
            onCreate={handleCreatePackage}
            onUpdate={handleUpdatePackage}
            onDelete={handleDeletePackage}
            onDuplicate={handleDuplicatePackage}
            onToggleActive={handleTogglePackageActive}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDay2Demo;

