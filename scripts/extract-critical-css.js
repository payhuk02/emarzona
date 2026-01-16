/**
 * Script pour extraire le CSS critique au build
 * Extrait le CSS nécessaire pour le First Contentful Paint (FCP)
 * 
 * Utilisation: node scripts/extract-critical-css.js
 */

const fs = require('fs');
const path = require('path');

/**
 * CSS critique minimal pour FCP
 * Contient uniquement les styles nécessaires pour le rendu above-the-fold
 */
const CRITICAL_CSS = `
/* Variables CSS critiques - Minimales pour FCP */
:root {
  --background: 0 0% 100%;
  --foreground: 220 40% 10%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --radius: 0.5rem;
}

/* Reset minimal */
*,::before,::after {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size: 1rem;
  line-height: 1.625;
  margin: 0;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

/* Container minimal */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Utilities critiques */
.relative { position: relative; }
.absolute { position: absolute; }
.flex { display: flex; }
.hidden { display: none; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.min-h-screen { min-height: 100vh; }
`;

/**
 * Extrait le CSS critique et le sauvegarde
 */
function extractCriticalCSS() {
  const outputDir = path.join(__dirname, '..', 'dist');
  const outputFile = path.join(outputDir, 'critical.css');

  // Créer le dossier dist s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Écrire le CSS critique
  fs.writeFileSync(outputFile, CRITICAL_CSS.trim(), 'utf8');

  console.log('✅ CSS critique extrait avec succès');
  console.log(`📁 Fichier: ${outputFile}`);
  console.log(`📊 Taille: ${(CRITICAL_CSS.length / 1024).toFixed(2)} KB`);

  return outputFile;
}

/**
 * Génère un fichier HTML avec le CSS critique inline
 */
function generateCriticalCSSHTML() {
  const outputDir = path.join(__dirname, '..', 'dist');
  const htmlFile = path.join(outputDir, 'critical-css.html');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Critique - Emarzona</title>
  <style>
${CRITICAL_CSS}
  </style>
</head>
<body>
  <div id="root">
    <div class="container">
      <h1>CSS Critique Extraite</h1>
      <p>Ce fichier contient le CSS critique pour le FCP.</p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(`📄 HTML généré: ${htmlFile}`);
}

// Exécuter si appelé directement
if (require.main === module) {
  try {
    extractCriticalCSS();
    generateCriticalCSSHTML();
    console.log('\n✅ Extraction CSS critique terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du CSS critique:', error);
    process.exit(1);
  }
}

module.exports = { extractCriticalCSS, CRITICAL_CSS };
