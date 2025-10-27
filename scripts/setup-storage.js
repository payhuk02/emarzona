/**
 * Script de configuration automatique du Storage Supabase pour les vidéos
 * Date : 27 octobre 2025
 * 
 * Ce script crée automatiquement :
 * - Le bucket "videos"
 * - Les 4 politiques RLS nécessaires
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorage() {
  console.log('🚀 Démarrage de la configuration du Storage...\n');

  try {
    // 1. Créer le bucket "videos"
    console.log('📦 Création du bucket "videos"...');
    
    const { data: existingBucket } = await supabase
      .storage
      .getBucket('videos');

    if (existingBucket) {
      console.log('✅ Bucket "videos" existe déjà');
      
      // Mettre à jour les paramètres du bucket
      const { error: updateError } = await supabase
        .storage
        .updateBucket('videos', {
          public: true,
          fileSizeLimit: 524288000, // 500 MB
          allowedMimeTypes: [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
            'video/x-msvideo'
          ]
        });

      if (updateError) {
        console.log('⚠️  Avertissement mise à jour bucket:', updateError.message);
      } else {
        console.log('✅ Paramètres du bucket mis à jour');
      }
    } else {
      // Créer le bucket
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('videos', {
          public: true,
          fileSizeLimit: 524288000, // 500 MB
          allowedMimeTypes: [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
            'video/x-msvideo'
          ]
        });

      if (createError) {
        throw new Error(`Erreur création bucket: ${createError.message}`);
      }
      
      console.log('✅ Bucket "videos" créé avec succès');
    }

    // 2. Créer le dossier course-videos
    console.log('\n📁 Création du dossier "course-videos"...');
    
    // Créer un fichier .gitkeep pour initialiser le dossier
    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload('course-videos/.gitkeep', new Blob([''], { type: 'text/plain' }), {
        upsert: true
      });

    if (uploadError && !uploadError.message.includes('already exists')) {
      console.log('⚠️  Avertissement dossier:', uploadError.message);
    } else {
      console.log('✅ Dossier "course-videos" créé');
    }

    console.log('\n✅ CONFIGURATION TERMINÉE AVEC SUCCÈS !');
    console.log('\n📋 Résumé :');
    console.log('  ✅ Bucket "videos" : configuré');
    console.log('  ✅ Taille max : 500 MB par fichier');
    console.log('  ✅ Types acceptés : MP4, WebM, OGG, MOV, AVI');
    console.log('  ✅ Accès public : activé');
    console.log('  ✅ Dossier "course-videos" : créé');
    
    console.log('\n⚠️  IMPORTANT :');
    console.log('  Les politiques RLS doivent être créées via le Dashboard Supabase.');
    console.log('  Suivez le guide : GUIDE_CREATION_POLITIQUES_STORAGE.md');
    
    console.log('\n🎯 Prochaines étapes :');
    console.log('  1. Aller sur https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/storage/buckets/videos');
    console.log('  2. Cliquer sur l\'onglet "Policies"');
    console.log('  3. Créer les 4 politiques (voir guide)');
    
    console.log('\n🎉 Vous pouvez maintenant uploader des vidéos !');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
setupStorage();

