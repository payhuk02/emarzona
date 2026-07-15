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
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // count how many times 'Select' is imported from ui/select
  const selectMatches = content.match(/from\s+['"]@\/components\/ui\/select['"]/g);
  
  if (selectMatches && selectMatches.length > 1) {
    console.log(`Found duplicate in ${file}, fixing...`);
    // Remove the exact single-line import
    const singleLineImportRegex = /import\s*{\s*Select\s*,\s*SelectContent\s*,\s*SelectItem\s*,\s*SelectTrigger\s*}\s*from\s+["']@\/components\/ui\/select["'];?\r?\n/g;
    const newContent = content.replace(singleLineImportRegex, '');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      fixed++;
      console.log(`Fixed ${file}`);
    } else {
      console.log(`Could not automatically fix ${file} - requires manual check.`);
    }
  }
});

console.log(`Fixed ${fixed} files.`);
