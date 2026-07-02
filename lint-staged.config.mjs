/** @type {import('lint-staged').Configuration} */
function isSupabaseEdgeFunction(file) {
  return file.replace(/\\/g, '/').includes('supabase/functions/');
}

export default {
  '*.{ts,tsx}': (files) => {
    const appFiles = files.filter((f) => !isSupabaseEdgeFunction(f));
    if (appFiles.length === 0) return [];
    return [`eslint --fix ${appFiles.join(' ')}`, `prettier --write ${appFiles.join(' ')}`];
  },
  '*.{json,css,md}': (files) => {
    const appFiles = files.filter((f) => !isSupabaseEdgeFunction(f));
    if (appFiles.length === 0) return [];
    return [`prettier --write ${appFiles.join(' ')}`];
  },
};
