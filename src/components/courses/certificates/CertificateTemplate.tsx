/**
 * Template de certificat imprimable
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { Award, CheckCircle2, Calendar } from 'lucide-react';

interface CertificateTemplateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  instructorName?: string;
}

export const CertificateTemplate = ({
  studentName,
  courseName,
  completionDate,
  certificateNumber,
  instructorName = 'Emarzona Academy',
}: CertificateTemplateProps) => {
  const formattedDate = new Date(completionDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative w-full aspect-[1.414/1] bg-white p-16 print:p-12" id="certificate">
      {/* Bordure décorative */}
      <div className="absolute inset-8 border-8 border-double border-orange-600 rounded-lg" />
      <div className="absolute inset-12 border-2 border-orange-400 rounded-lg" />

      {/* Contenu */}
      <div className="relative h-full flex flex-col items-center justify-center text-center space-y-8">
        {/* Logo/Icône */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
          <Award className="w-12 h-12 text-white" />
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-gray-900 tracking-wide">
            CERTIFICAT
          </h1>
          <p className="text-2xl text-orange-600 font-semibold">
            de Réussite
          </p>
        </div>

        {/* Message principal */}
        <div className="space-y-6 max-w-3xl">
          <p className="text-lg text-gray-700">
            Ceci certifie que
          </p>
          
          <p className="text-4xl font-bold text-gray-900 border-b-2 border-orange-600 pb-2 px-8">
            {studentName}
          </p>

          <p className="text-lg text-gray-700">
            a terminé avec succès le cours
          </p>

          <p className="text-3xl font-semibold text-orange-700">
            {courseName}
          </p>
        </div>

        {/* Informations supplémentaires */}
        <div className="flex items-center gap-12 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm">Certifié</span>
          </div>
        </div>

        {/* Signature et numéro */}
        <div className="absolute bottom-16 left-16 right-16 flex items-end justify-between">
          <div className="text-left">
            <div className="border-t-2 border-gray-900 w-48 mb-2" />
            <p className="text-sm font-semibold">{instructorName}</p>
            <p className="text-xs text-gray-600">Instructeur</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">N° Certificat</p>
            <p className="text-sm font-mono font-semibold">{certificateNumber}</p>
          </div>
        </div>
      </div>

      {/* Watermark Emarzona */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-xs text-gray-400">Emarzona Academy - Plateforme E-Learning</p>
      </div>
    </div>
  );
};

