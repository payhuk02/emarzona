const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement depuis .env
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/"/g, ''); // Remove quotes
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement de .env:', error.message);
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyAdvancedFeaturesMigration() {
  console.log('\n🔧 Application de la migration des fonctionnalités avancées\n');

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250122_advanced_payment_and_messaging.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL chargée, taille:', migrationSQL.length, 'caractères');

    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 ${commands.length} commandes SQL à exécuter`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim() === '') continue;

      try {
        console.log(`\n🔄 Exécution commande ${i + 1}/${commands.length}...`);
        console.log(`📝 ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);

        const { data, error } = await supabase.rpc('exec_sql', { sql: command });

        if (error) {
          console.log(`❌ Erreur commande ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Commande ${i + 1} exécutée avec succès`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception commande ${i + 1}: ${err.message}`);
        errorCount++;
      }

      // Pause entre les commandes pour éviter les timeouts
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Résumé de l'exécution:`);
    console.log(`✅ Commandes réussies: ${successCount}`);
    console.log(`❌ Commandes échouées: ${errorCount}`);
    console.log(`📈 Taux de réussite: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration appliquée avec succès !');
      console.log('🔗 Les nouvelles fonctionnalités sont maintenant disponibles');
    } else {
      console.log('\n⚠️ Migration partiellement appliquée');
      console.log('🔍 Vérifiez les erreurs ci-dessus et réessayez si nécessaire');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application de la migration:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Vérifiez que le fichier de migration existe');
    console.log('2. Vérifiez vos permissions Supabase');
    console.log('3. Appliquez la migration manuellement via le dashboard Supabase');
  }
}

// Alternative: Exécuter les commandes une par une via des appels directs
async function applyMigrationDirectly() {
  console.log('\n🔧 Application directe de la migration\n');

  const migrations = [
    // 1. Ajouter les nouvelles colonnes à payments
    {
      name: "Ajouter colonnes avancées à payments",
      sql: `
        ALTER TABLE public.payments 
        ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured')),
        ADD COLUMN IF NOT EXISTS percentage_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS percentage_rate NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_held BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS held_until TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS release_conditions JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS dispute_resolution TEXT;
      `
    },
    // 2. Ajouter les nouvelles colonnes à orders
    {
      name: "Ajouter colonnes avancées à orders",
      sql: `
        ALTER TABLE public.orders 
        ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured')),
        ADD COLUMN IF NOT EXISTS percentage_paid NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered', 'confirmed', 'disputed')),
        ADD COLUMN IF NOT EXISTS delivery_tracking TEXT,
        ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
        ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id);
      `
    },
    // 3. Créer la table partial_payments
    {
      name: "Créer table partial_payments",
      sql: `
        CREATE TABLE IF NOT EXISTS public.partial_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
          amount NUMERIC NOT NULL,
          percentage NUMERIC NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          payment_method TEXT NOT NULL,
          transaction_id TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    },
    // 4. Créer la table secured_payments
    {
      name: "Créer table secured_payments",
      sql: `
        CREATE TABLE IF NOT EXISTS public.secured_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
          total_amount NUMERIC NOT NULL,
          held_amount NUMERIC NOT NULL,
          status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
          hold_reason TEXT NOT NULL DEFAULT 'delivery_confirmation',
          release_conditions JSONB DEFAULT '{}'::jsonb,
          held_until TIMESTAMP WITH TIME ZONE,
          released_at TIMESTAMP WITH TIME ZONE,
          released_by UUID REFERENCES auth.users(id),
          dispute_opened_at TIMESTAMP WITH TIME ZONE,
          dispute_resolved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    },
    // 5. Créer la table conversations
    {
      name: "Créer table conversations",
      sql: `
        CREATE TABLE IF NOT EXISTS public.conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
          customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
          customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          store_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'disputed')),
          last_message_at TIMESTAMP WITH TIME ZONE,
          admin_intervention BOOLEAN DEFAULT FALSE,
          admin_user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    },
    // 6. Créer la table messages
    {
      name: "Créer table messages",
      sql: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'store', 'admin')),
          content TEXT,
          message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file', 'system')),
          metadata JSONB DEFAULT '{}'::jsonb,
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    },
    // 7. Créer la table message_attachments
    {
      name: "Créer table message_attachments",
      sql: `
        CREATE TABLE IF NOT EXISTS public.message_attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_url TEXT NOT NULL,
          storage_path TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    },
    // 8. Créer la table disputes
    {
      name: "Créer table disputes",
      sql: `
        CREATE TABLE IF NOT EXISTS public.disputes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
          initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          initiator_type TEXT NOT NULL CHECK (initiator_type IN ('customer', 'store')),
          reason TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
          resolution TEXT,
          admin_notes TEXT,
          assigned_admin_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          resolved_at TIMESTAMP WITH TIME ZONE
        );
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`\n🔄 ${i + 1}/${migrations.length}: ${migration.name}`);

    try {
      // Utiliser une approche différente pour chaque type de commande
      if (migration.sql.includes('ALTER TABLE')) {
        // Pour les ALTER TABLE, on peut essayer de les exécuter directement
        console.log('⚠️ Commande ALTER TABLE - nécessite des permissions élevées');
        console.log('💡 Cette commande doit être exécutée manuellement via le dashboard Supabase');
        errorCount++;
      } else if (migration.sql.includes('CREATE TABLE')) {
        // Pour les CREATE TABLE, on peut essayer de les exécuter
        console.log('📝 Tentative de création de table...');
        // Note: Cette approche peut ne pas fonctionner selon les permissions
        console.log('⚠️ Commande CREATE TABLE - nécessite des permissions élevées');
        console.log('💡 Cette commande doit être exécutée manuellement via le dashboard Supabase');
        errorCount++;
      } else {
        console.log('✅ Commande traitée');
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Erreur: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`✅ Commandes traitées: ${successCount}`);
  console.log(`❌ Commandes nécessitant une intervention manuelle: ${errorCount}`);

  console.log('\n💡 Instructions pour appliquer la migration manuellement:');
  console.log('1. Connectez-vous à votre dashboard Supabase');
  console.log('2. Allez dans SQL Editor');
  console.log('3. Copiez le contenu du fichier supabase/migrations/20250122_advanced_payment_and_messaging.sql');
  console.log('4. Exécutez le script SQL');
  console.log('5. Vérifiez que toutes les tables et colonnes ont été créées');
}

// Exécuter la migration
applyMigrationDirectly().catch(console.error);
