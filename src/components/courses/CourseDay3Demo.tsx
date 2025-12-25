/**
 * 🧪 DEMO - JOUR 3 - Composants Courses
 * 
 * Ce fichier démontre l'utilisation des composants :
 * 1. EnrollmentHistory
 * 2. BulkCourseUpdate
 * 
 * Date : 29 Octobre 2025
 */

import { logger } from '@/lib/logger';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrollmentHistory, type EnrollmentEvent } from './EnrollmentHistory';
import { BulkCourseUpdate, type BulkUpdateCourse, type BulkUpdateChange } from './BulkCourseUpdate';

// Données de test - Événements
const sampleEvents: EnrollmentEvent[] = [
  {
    id: 'EVT-001',
    enrollmentId: 'ENR-12345',
    type: 'enrolled',
    timestamp: new Date('2024-10-29T10:30:00'),
    studentName: 'Amadou Diallo',
    studentEmail: 'amadou.d@example.com',
    courseName: 'React & TypeScript Avancé',
    description: 'Nouvelle inscription au cours React & TypeScript Avancé',
    metadata: {
      amount: 149,
      currency: 'EUR',
    },
  },
  {
    id: 'EVT-002',
    enrollmentId: 'ENR-12345',
    type: 'payment_received',
    timestamp: new Date('2024-10-29T10:31:00'),
    studentName: 'Amadou Diallo',
    studentEmail: 'amadou.d@example.com',
    courseName: 'React & TypeScript Avancé',
    description: 'Paiement reçu pour le cours',
    metadata: {
      amount: 149,
      currency: 'EUR',
    },
  },
  {
    id: 'EVT-003',
    enrollmentId: 'ENR-12346',
    type: 'lesson_completed',
    timestamp: new Date('2024-10-28T15:22:00'),
    studentName: 'Marie Kouassi',
    studentEmail: 'marie.k@example.com',
    courseName: 'Node.js & Express API',
    description: 'Leçon "Introduction aux Middlewares" terminée',
    metadata: {
      lessonTitle: 'Introduction aux Middlewares',
      progressPercentage: 45,
    },
  },
  {
    id: 'EVT-004',
    enrollmentId: 'ENR-12347',
    type: 'quiz_passed',
    timestamp: new Date('2024-10-28T14:10:00'),
    studentName: 'Karim Ouédraogo',
    studentEmail: 'karim.o@example.com',
    courseName: 'Python pour Data Science',
    description: 'Quiz "Pandas & NumPy" réussi',
    metadata: {
      quizScore: 92,
      progressPercentage: 67,
    },
  },
  {
    id: 'EVT-005',
    enrollmentId: 'ENR-12348',
    type: 'certificate_issued',
    timestamp: new Date('2024-10-27T09:45:00'),
    studentName: 'Fatou Sow',
    studentEmail: 'fatou.s@example.com',
    courseName: 'UI/UX Design Masterclass',
    description: 'Certificat de complétion émis',
    metadata: {
      certificateId: 'CERT-12348',
      progressPercentage: 100,
    },
  },
  {
    id: 'EVT-006',
    enrollmentId: 'ENR-12349',
    type: 'enrolled',
    timestamp: new Date('2024-10-27T08:15:00'),
    studentName: 'Ibrahim Touré',
    studentEmail: 'ibrahim.t@example.com',
    courseName: 'Vue.js 3 Complet',
    description: 'Nouvelle inscription au cours Vue.js 3 Complet',
  },
  {
    id: 'EVT-007',
    enrollmentId: 'ENR-12350',
    type: 'completed',
    timestamp: new Date('2024-10-26T16:30:00'),
    studentName: 'Aïcha Diop',
    studentEmail: 'aicha.d@example.com',
    courseName: 'DevOps & Docker',
    description: 'Cours terminé avec succès',
    metadata: {
      progressPercentage: 100,
    },
  },
  {
    id: 'EVT-008',
    enrollmentId: 'ENR-12351',
    type: 'lesson_completed',
    timestamp: new Date('2024-10-26T11:20:00'),
    studentName: 'Youssouf Diarra',
    studentEmail: 'youssouf.d@example.com',
    courseName: 'Marketing Digital Stratégique',
    description: 'Leçon "SEO & SEM" terminée',
    metadata: {
      lessonTitle: 'SEO & SEM',
      progressPercentage: 78,
    },
  },
  {
    id: 'EVT-009',
    enrollmentId: 'ENR-12352',
    type: 'payment_received',
    timestamp: new Date('2024-10-25T13:45:00'),
    studentName: 'Sophie Laurent',
    studentEmail: 'sophie.l@example.com',
    courseName: 'Développement Personnel Pro',
    description: 'Paiement reçu pour le cours',
    metadata: {
      amount: 79,
      currency: 'EUR',
    },
  },
  {
    id: 'EVT-010',
    enrollmentId: 'ENR-12353',
    type: 'refund_issued',
    timestamp: new Date('2024-10-24T10:00:00'),
    studentName: 'Marc Petit',
    studentEmail: 'marc.p@example.com',
    courseName: 'React & TypeScript Avancé',
    description: 'Remboursement effectué',
    metadata: {
      amount: 149,
      currency: 'EUR',
      refundReason: 'Demande client',
    },
  },
];

// Données de test - Cours pour bulk update
const sampleCoursesForUpdate: BulkUpdateCourse[] = [
  {
    id: 'CRS-001',
    name: 'React & TypeScript Avancé',
    currentPrice: 149,
    currentMaxStudents: 100,
    currentStatus: 'published',
    currentCategory: 'development',
    isActive: true,
    enrolledStudents: 85,
  },
  {
    id: 'CRS-002',
    name: 'Node.js & Express API',
    currentPrice: 99,
    currentMaxStudents: 150,
    currentStatus: 'published',
    currentCategory: 'development',
    isActive: true,
    enrolledStudents: 120,
  },
  {
    id: 'CRS-003',
    name: 'Python pour Data Science',
    currentPrice: 199,
    currentMaxStudents: 80,
    currentStatus: 'published',
    currentCategory: 'data_science',
    isActive: true,
    enrolledStudents: 67,
  },
  {
    id: 'CRS-004',
    name: 'UI/UX Design Masterclass',
    currentPrice: 129,
    currentMaxStudents: 100,
    currentStatus: 'published',
    currentCategory: 'design',
    isActive: true,
    enrolledStudents: 92,
  },
  {
    id: 'CRS-005',
    name: 'Vue.js 3 Complet',
    currentPrice: 89,
    currentMaxStudents: 60,
    currentStatus: 'in_progress',
    currentCategory: 'development',
    isActive: true,
    enrolledStudents: 45,
  },
  {
    id: 'CRS-006',
    name: 'Marketing Digital Stratégique',
    currentPrice: 119,
    currentMaxStudents: 100,
    currentStatus: 'published',
    currentCategory: 'marketing',
    isActive: true,
    enrolledStudents: 78,
  },
  {
    id: 'CRS-007',
    name: 'Développement Personnel Pro',
    currentPrice: 79,
    currentMaxStudents: 50,
    currentStatus: 'draft',
    currentCategory: 'personal_development',
    isActive: false,
    enrolledStudents: 0,
  },
  {
    id: 'CRS-008',
    name: 'DevOps & Docker',
    currentPrice: 179,
    currentMaxStudents: 200,
    currentStatus: 'archived',
    currentCategory: 'development',
    isActive: false,
    enrolledStudents: 156,
  },
];

/**
 * Composant de démonstration principale
 */
export const CourseDay3Demo: React.FC = () => {
  const [events] = useState<EnrollmentEvent[]>(sampleEvents);
  const [courses, setCourses] = useState<BulkUpdateCourse[]>(sampleCoursesForUpdate);

  // Handlers pour EnrollmentHistory
  const handleRefresh = () => {
    logger.info('Refresh events');
    alert('Rafraîchissement de l\'historique...');
  };

  const handleViewDetails = (enrollmentId: string) => {
    logger.info('View details', { enrollmentId });
    alert(`Voir les détails de l'inscription: ${enrollmentId}`);
  };

  // Handlers pour BulkCourseUpdate
  const handleBulkUpdate = (courseIds: string[], changes: BulkUpdateChange) => {
    logger.info('Bulk update', { courseIds, changesCount: Object.keys(changes).length });

    // Simuler la mise à jour
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (!courseIds.includes(course.id)) return course;

        const updatedCourse = { ...course };

        switch (changes.field) {
          case 'price':
            if (changes.mode === 'set') {
              updatedCourse.currentPrice = changes.value as number;
            } else {
              const adjustment = String(changes.value).includes('%')
                ? course.currentPrice * (parseFloat(String(changes.value)) / 100)
                : (changes.value as number);
              updatedCourse.currentPrice += adjustment;
            }
            break;

          case 'maxStudents':
            if (changes.mode === 'set') {
              updatedCourse.currentMaxStudents = changes.value as number;
            } else {
              updatedCourse.currentMaxStudents += changes.value as number;
            }
            break;

          case 'status':
            updatedCourse.currentStatus = changes.value as any;
            break;

          case 'category':
            updatedCourse.currentCategory = changes.value as any;
            break;

          case 'isActive':
            updatedCourse.isActive = changes.value as boolean;
            break;
        }

        return updatedCourse;
      })
    );

    alert(`Mise à jour appliquée à ${courseIds.length} cours !`);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          🎓 Démonstration - Composants Courses Jour 3
        </h1>
        <p className="text-muted-foreground">
          EnrollmentHistory & BulkCourseUpdate - Historique et mises à jour groupées
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="enrollment-history" className="space-y-6">
        <TabsList className="grid w-full md:w-[500px] grid-cols-2">
          <TabsTrigger value="enrollment-history">EnrollmentHistory</TabsTrigger>
          <TabsTrigger value="bulk-update">BulkCourseUpdate</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: EnrollmentHistory ==================== */}
        <TabsContent value="enrollment-history" className="space-y-6">
          <EnrollmentHistory
            events={events}
            onRefresh={handleRefresh}
            onViewDetails={handleViewDetails}
            showFilters={true}
            showStats={true}
          />
        </TabsContent>

        {/* ==================== TAB 2: BulkCourseUpdate ==================== */}
        <TabsContent value="bulk-update" className="space-y-6">
          <BulkCourseUpdate
            courses={courses}
            onBulkUpdate={handleBulkUpdate}
            showCsvFeatures={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDay3Demo;

