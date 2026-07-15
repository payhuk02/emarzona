const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/hooks');
let hasDupes = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Regex to extract all import declarations correctly
  const importRegex = /import\s+[\s\S]*?from\s+['"][^'"]+['"]/g;
  const imports = content.match(importRegex);
  
  if (imports) {
    // Check if the exact same import block exists twice
    const importSet = new Set();
    imports.forEach(imp => {
      // normalize whitespace
      const normalized = imp.replace(/\s+/g, ' ').trim();
      if (importSet.has(normalized)) {
        console.log(`Duplicate import in ${file}:\n  ${normalized}`);
        hasDupes = true;
      }
      importSet.add(normalized);
    });
    
    // Also check for multiple imports from the same source
    const sourceRegex = /from\s+['"]([^'"]+)['"]/;
    const sourceMap = new Map();
    imports.forEach(imp => {
      const match = imp.match(sourceRegex);
      if (match) {
        const source = match[1];
        if (sourceMap.has(source)) {
          // This could be intentional (e.g. one for types, one for values)
          // But it's worth flagging
          // console.log(`Multiple imports from ${source} in ${file}`);
        }
        sourceMap.set(source, true);
      }
    });
  }
});

if (!hasDupes) console.log('No identical duplicate imports found.');
