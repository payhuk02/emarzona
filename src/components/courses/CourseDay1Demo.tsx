/**
 * 🧪 DEMO - JOUR 1 - Composants Courses
 * 
 * Ce fichier démontre l'utilisation des composants :
 * 1. CourseStatusIndicator (3 variants)
 * 2. EnrollmentInfoDisplay (3 variants)
 * 
 * Date : 29 Octobre 2025
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CourseStatusIndicator, type CourseStatus } from './CourseStatusIndicator';
import { 
  EnrollmentInfoDisplay, 
  type EnrollmentStatus,
  type EnrollmentStudent,
  type EnrollmentCourse
} from './EnrollmentInfoDisplay';

/**
 * Composant de démonstration principale
 */
export const CourseDay1Demo: React.FC = () => {
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('published');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('active');

  // Données de test - Étudiant
  const sampleStudent: EnrollmentStudent = {
    id: 'STU-001',
    name: 'Amadou Diallo',
    email: 'amadou.diallo@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
  };

  // Données de test - Cours
  const sampleCourse: EnrollmentCourse = {
    id: 'CRS-001',
    name: 'React & TypeScript Avancé',
    instructor: 'Sarah Martin',
    duration: 25,
    price: 149,
    currency: 'EUR',
    totalLessons: 42,
  };

  const handleAction = (action: string) => {
    console.log('Action:', action);
    alert(`Action: ${action}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          🎓 Démonstration - Composants Courses Jour 1
        </h1>
        <p className="text-muted-foreground">
          CourseStatusIndicator & EnrollmentInfoDisplay - 3 variants chacun
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="course-status" className="space-y-6">
        <TabsList className="grid w-full md:w-[500px] grid-cols-2">
          <TabsTrigger value="course-status">CourseStatusIndicator</TabsTrigger>
          <TabsTrigger value="enrollment-info">EnrollmentInfoDisplay</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: CourseStatusIndicator ==================== */}
        <TabsContent value="course-status" className="space-y-6">
          {/* Status Selector */}
          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Choisir un statut :</p>
            <div className="flex flex-wrap gap-2">
              {(['draft', 'published', 'in_progress', 'completed', 'archived'] as CourseStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    variant={courseStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCourseStatus(status)}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
          </Card>

          {/* Variant 1: Compact */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">1. Variant: Compact</h2>
            <Card className="p-6 space-y-3">
              <CourseStatusIndicator
                status={courseStatus}
                variant="compact"
                enrolledStudents={85}
                maxStudents={100}
                averageCompletion={67}
              />
              <CourseStatusIndicator
                status="published"
                variant="compact"
                enrolledStudents={12}
                maxStudents={50}
              />
              <CourseStatusIndicator
                status="completed"
                variant="compact"
              />
            </Card>
          </div>

          {/* Variant 2: Default */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">2. Variant: Default</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <CourseStatusIndicator
                status={courseStatus}
                variant="default"
                enrolledStudents={85}
                maxStudents={100}
                showProgress={true}
                averageCompletion={67}
                revenue={12750}
                instructor="Sarah Martin"
              />
              <CourseStatusIndicator
                status="published"
                variant="default"
                enrolledStudents={98}
                maxStudents={100}
                showProgress={true}
                lowCapacityThreshold={15}
                averageCompletion={45}
                instructor="Jean Dupont"
              />
            </div>
          </div>

          {/* Variant 3: Detailed */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">3. Variant: Detailed</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <CourseStatusIndicator
                status={courseStatus}
                variant="detailed"
                enrolledStudents={85}
                maxStudents={100}
                showProgress={true}
                recentEnrollments={12}
                enrollmentTrend="up"
                averageCompletion={67}
                revenue={12750}
                currency="EUR"
                instructor="Sarah Martin"
              />
              <CourseStatusIndicator
                status="published"
                variant="detailed"
                enrolledStudents={47}
                maxStudents={50}
                showProgress={true}
                lowCapacityThreshold={10}
                recentEnrollments={5}
                enrollmentTrend="stable"
                averageCompletion={78}
                revenue={7050}
                currency="EUR"
                instructor="Marc Traoré"
              />
            </div>
          </div>

          {/* Special cases */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">4. Cas Spéciaux</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Draft with no students */}
              <CourseStatusIndicator
                status="draft"
                variant="detailed"
                enrolledStudents={0}
                maxStudents={100}
                showProgress={true}
                instructor="Julie Koné"
              />
              {/* Low capacity alert */}
              <CourseStatusIndicator
                status="published"
                variant="detailed"
                enrolledStudents={96}
                maxStudents={100}
                showProgress={true}
                lowCapacityThreshold={5}
                recentEnrollments={8}
                enrollmentTrend="up"
                averageCompletion={82}
                instructor="Pierre Sawadogo"
              />
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: EnrollmentInfoDisplay ==================== */}
        <TabsContent value="enrollment-info" className="space-y-6">
          {/* Status Selector */}
          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Choisir un statut :</p>
            <div className="flex flex-wrap gap-2">
              {(
                ['pending', 'active', 'completed', 'expired', 'cancelled', 'refunded'] as EnrollmentStatus[]
              ).map((status) => (
                <Button
                  key={status}
                  variant={enrollmentStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnrollmentStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </Card>

          {/* Variant 1: Compact */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">1. Variant: Compact</h2>
            <Card className="p-6 space-y-3">
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12345"
                status={enrollmentStatus}
                enrolledDate={new Date('2024-10-01')}
                student={sampleStudent}
                course={sampleCourse}
                progress={67}
                variant="compact"
              />
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12346"
                status="active"
                enrolledDate={new Date('2024-09-15')}
                student={{
                  id: 'STU-002',
                  name: 'Marie Kouassi',
                  email: 'marie.k@example.com',
                }}
                course={{
                  id: 'CRS-002',
                  name: 'Node.js & Express API',
                  instructor: 'David Laurent',
                  duration: 18,
                  price: 99,
                }}
                progress={92}
                variant="compact"
              />
            </Card>
          </div>

          {/* Variant 2: Default */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">2. Variant: Default</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12345"
                status={enrollmentStatus}
                enrolledDate={new Date('2024-10-01')}
                student={sampleStudent}
                course={sampleCourse}
                progress={67}
                completedLessons={28}
                variant="default"
                hasCertificate={false}
                showActions={true}
                onAction={handleAction}
              />
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12347"
                status="completed"
                enrolledDate={new Date('2024-08-10')}
                student={{
                  id: 'STU-003',
                  name: 'Karim Ouédraogo',
                  email: 'karim.o@example.com',
                }}
                course={{
                  id: 'CRS-003',
                  name: 'Python pour Data Science',
                  instructor: 'Sophie Bernard',
                  duration: 30,
                  price: 199,
                  totalLessons: 56,
                }}
                progress={100}
                completedLessons={56}
                variant="default"
                hasCertificate={true}
                showActions={true}
                onAction={handleAction}
              />
            </div>
          </div>

          {/* Variant 3: Detailed */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">3. Variant: Detailed</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12345"
                status={enrollmentStatus}
                enrolledDate={new Date('2024-10-01')}
                student={sampleStudent}
                course={sampleCourse}
                progress={67}
                completedLessons={28}
                timeSpent={1245}
                variant="detailed"
                lastActivity={new Date('2024-10-28')}
                expiryDate={new Date('2025-10-01')}
                amountPaid={149}
                paymentMethod="Moneroo"
                hasCertificate={false}
                averageScore={85}
                showActions={true}
                onAction={handleAction}
              />
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12348"
                status="active"
                enrolledDate={new Date('2024-09-20')}
                student={{
                  id: 'STU-004',
                  name: 'Fatou Sow',
                  email: 'fatou.s@example.com',
                  avatar: 'https://i.pravatar.cc/150?img=47',
                }}
                course={{
                  id: 'CRS-004',
                  name: 'UI/UX Design Masterclass',
                  instructor: 'Emma Wilson',
                  duration: 22,
                  price: 129,
                  currency: 'EUR',
                  totalLessons: 38,
                }}
                progress={45}
                completedLessons={17}
                timeSpent={680}
                variant="detailed"
                lastActivity={new Date('2024-10-27')}
                amountPaid={129}
                paymentMethod="Carte bancaire"
                hasCertificate={false}
                averageScore={92}
                showActions={true}
                onAction={handleAction}
              />
            </div>
          </div>

          {/* Special cases */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">4. Cas Spéciaux</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pending payment */}
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12349"
                status="pending"
                enrolledDate={new Date()}
                student={{
                  id: 'STU-005',
                  name: 'Ibrahim Touré',
                  email: 'ibrahim.t@example.com',
                }}
                course={{
                  id: 'CRS-005',
                  name: 'Vue.js 3 Complet',
                  instructor: 'Luc Moreau',
                  duration: 16,
                  price: 89,
                  currency: 'EUR',
                }}
                variant="detailed"
                showActions={true}
                onAction={handleAction}
              />
              {/* Completed with certificate */}
              <EnrollmentInfoDisplay
                enrollmentId="ENR-12350"
                status="completed"
                enrolledDate={new Date('2024-07-01')}
                student={{
                  id: 'STU-006',
                  name: 'Aïcha Diop',
                  email: 'aicha.d@example.com',
                  avatar: 'https://i.pravatar.cc/150?img=25',
                }}
                course={{
                  id: 'CRS-006',
                  name: 'DevOps & Docker',
                  instructor: 'Thomas Petit',
                  duration: 28,
                  price: 179,
                  currency: 'EUR',
                  totalLessons: 48,
                }}
                progress={100}
                completedLessons={48}
                timeSpent={1890}
                variant="detailed"
                lastActivity={new Date('2024-08-30')}
                amountPaid={179}
                paymentMethod="Moneroo"
                hasCertificate={true}
                averageScore={94}
                showActions={true}
                onAction={handleAction}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDay1Demo;

