import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeBundle() {
  const distPath = join(__dirname, '..', 'dist');
  const jsPath = join(distPath, 'js');
  const assetsPath = join(distPath, 'assets');

  console.log('📊 Analyse des bundles...\n');

  try {
    // Analyser les fichiers JS
    const jsFiles = await readdir(jsPath);
    const jsStats = await Promise.all(
      jsFiles.map(async (file) => {
        const filePath = join(jsPath, file);
        const stats = await stat(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        };
      })
    );

    // Trier par taille
    jsStats.sort((a, b) => b.size - a.size);

    console.log('📦 Top 20 des chunks JS (par taille):');
    console.log('─'.repeat(80));
    jsStats.slice(0, 20).forEach((file, index) => {
      const size = parseFloat(file.sizeMB) > 1 
        ? `${file.sizeMB} MB` 
        : `${file.sizeKB} KB`;
      console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(50)} ${size.padStart(10)}`);
    });

    // Calculer le total
    const totalJS = jsStats.reduce((sum, file) => sum + file.size, 0);
    const totalJSMB = (totalJS / (1024 * 1024)).toFixed(2);
    console.log('─'.repeat(80));
    console.log(`Total JS: ${totalJSMB} MB\n`);

    // Identifier le bundle principal
    const mainBundle = jsStats.find(file => file.name.startsWith('index-'));
    if (mainBundle) {
      console.log('🎯 Bundle principal identifié:');
      console.log(`   Nom: ${mainBundle.name}`);
      console.log(`   Taille: ${parseFloat(mainBundle.sizeMB) > 1 ? `${mainBundle.sizeMB} MB` : `${mainBundle.sizeKB} KB`}`);
      console.log(`   Pourcentage du total: ${((mainBundle.size / totalJS) * 100).toFixed(2)}%\n`);
    }

    // Analyser les fichiers CSS
    const cssFiles = await readdir(assetsPath).catch(() => []);
    const cssStats = await Promise.all(
      cssFiles
        .filter(file => file.endsWith('.css'))
        .map(async (file) => {
          const filePath = join(assetsPath, file);
          const stats = await stat(filePath);
          return {
            name: file,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          };
        })
    );

    if (cssStats.length > 0) {
      cssStats.sort((a, b) => b.size - a.size);
      console.log('🎨 Fichiers CSS (par taille):');
      console.log('─'.repeat(80));
      cssStats.forEach((file, index) => {
        const size = parseFloat(file.sizeMB) > 1 
          ? `${file.sizeMB} MB` 
          : `${file.sizeKB} KB`;
        console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(50)} ${size.padStart(10)}`);
      });

      const totalCSS = cssStats.reduce((sum, file) => sum + file.size, 0);
      const totalCSSMB = (totalCSS / (1024 * 1024)).toFixed(2);
      console.log('─'.repeat(80));
      console.log(`Total CSS: ${totalCSSMB} MB\n`);

      // Vérifier UnsubscribePage
      const unsubscribeCSS = cssStats.find(file => 
        file.name.includes('UnsubscribePage') || 
        file.name.includes('unsubscribe')
      );
      if (unsubscribeCSS) {
        console.log('✅ CSS UnsubscribePage trouvé:');
        console.log(`   Nom: ${unsubscribeCSS.name}`);
        console.log(`   Taille: ${unsubscribeCSS.sizeKB} KB\n`);
      } else {
        console.log('⚠️  CSS UnsubscribePage non trouvé (probablement dans index-DTdh9nYP.css)\n');
      }
    }

    // Recommandations
    console.log('💡 Recommandations:');
    const largeChunks = jsStats.filter(f => f.size > 300 * 1024);
    if (largeChunks.length > 0) {
      console.log(`   ⚠️  ${largeChunks.length} chunk(s) dépassent 300 KB:`);
      largeChunks.forEach(chunk => {
        console.log(`      - ${chunk.name}: ${chunk.sizeKB} KB`);
      });
    } else {
      console.log('   ✅ Tous les chunks sont < 300 KB');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
    process.exit(1);
  }
}

analyzeBundle();
