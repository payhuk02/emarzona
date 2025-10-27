#!/usr/bin/env node
/**
 * Script d'analyse du bundle size
 * Date : 27 octobre 2025
 * Usage: npm run build && node scripts/analyze-bundle.js
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = join(__dirname, '../dist/assets');
const SIZE_LIMITS = {
  js: 500 * 1024, // 500KB per JS chunk
  css: 100 * 1024, // 100KB per CSS file
  total: 2 * 1024 * 1024, // 2MB total
};

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

async function analyzeDirectory(dirPath) {
  const files = await readdir(dirPath);
  const analysis = {
    js: [],
    css: [],
    other: [],
    totalSize: 0,
  };

  for (const file of files) {
    const filePath = join(dirPath, file);
    const fileStats = await stat(filePath);

    if (fileStats.isDirectory()) continue;

    const size = fileStats.size;
    analysis.totalSize += size;

    const fileInfo = { name: file, size };

    if (file.endsWith('.js')) {
      analysis.js.push(fileInfo);
    } else if (file.endsWith('.css')) {
      analysis.css.push(fileInfo);
    } else {
      analysis.other.push(fileInfo);
    }
  }

  return analysis;
}

function printWarnings(analysis) {
  const warnings = [];

  // Check JS chunks
  analysis.js.forEach((file) => {
    if (file.size > SIZE_LIMITS.js) {
      warnings.push(`⚠️  Large JS chunk: ${file.name} (${formatSize(file.size)})`);
    }
  });

  // Check CSS files
  analysis.css.forEach((file) => {
    if (file.size > SIZE_LIMITS.css) {
      warnings.push(`⚠️  Large CSS file: ${file.name} (${formatSize(file.size)})`);
    }
  });

  // Check total size
  if (analysis.totalSize > SIZE_LIMITS.total) {
    warnings.push(`⚠️  Total bundle size exceeds limit: ${formatSize(analysis.totalSize)}`);
  }

  return warnings;
}

function printRecommendations(analysis) {
  const recommendations = [];

  const largestJS = analysis.js.sort((a, b) => b.size - a.size)[0];
  if (largestJS && largestJS.size > SIZE_LIMITS.js) {
    recommendations.push('💡 Consider code splitting for large JS chunks');
    recommendations.push('💡 Use dynamic imports for rarely-used components');
  }

  const totalJSSize = analysis.js.reduce((sum, f) => sum + f.size, 0);
  const totalCSSSize = analysis.css.reduce((sum, f) => sum + f.size, 0);

  if (totalCSSSize > totalJSSize * 0.3) {
    recommendations.push('💡 Consider purging unused CSS with PurgeCSS');
  }

  if (analysis.js.length > 20) {
    recommendations.push('💡 Too many JS chunks, consider merging related modules');
  }

  return recommendations;
}

async function main() {
  console.log('🔍 Analyzing bundle size...\n');

  try {
    const analysis = await analyzeDirectory(DIST_PATH);

    // Print summary
    console.log('📊 Bundle Size Summary:');
    console.log('─'.repeat(60));
    console.log(`Total Size:     ${formatSize(analysis.totalSize)}`);
    console.log(`JS Files:       ${analysis.js.length} (${formatSize(analysis.js.reduce((sum, f) => sum + f.size, 0))})`);
    console.log(`CSS Files:      ${analysis.css.length} (${formatSize(analysis.css.reduce((sum, f) => sum + f.size, 0))})`);
    console.log(`Other Files:    ${analysis.other.length} (${formatSize(analysis.other.reduce((sum, f) => sum + f.size, 0))})`);
    console.log('─'.repeat(60));

    // Print largest files
    console.log('\n📦 Largest Files:');
    const allFiles = [...analysis.js, ...analysis.css, ...analysis.other]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    allFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} - ${formatSize(file.size)}`);
    });

    // Print warnings
    const warnings = printWarnings(analysis);
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((warning) => console.log(warning));
    } else {
      console.log('\n✅ No warnings - bundle size looks good!');
    }

    // Print recommendations
    const recommendations = printRecommendations(analysis);
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec) => console.log(rec));
    }

    // Exit code
    if (warnings.length > 0) {
      console.log('\n⚠️  Build completed with warnings');
      process.exit(0); // Don't fail build, just warn
    } else {
      console.log('\n✅ Bundle size analysis complete!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

main();
