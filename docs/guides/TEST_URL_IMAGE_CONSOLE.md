# Test de l'URL de l'image dans la console

## 🔍 Test rapide dans la console du navigateur

Copiez-collez ce code dans la console du navigateur (F12 > Console) pour tester l'URL de l'image :

```javascript
// Remplacer par votre URL Supabase (visible dans les variables d'environnement)
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const filePath = 'vendor-message-attachments/1765207968982-y0xu1n9lneq.png';

// Test 1 : URL sans encodage
const url1 = `${supabaseUrl}/storage/v1/object/public/attachments/${filePath}`;
console.log('URL 1 (sans encodage):', url1);

// Test 2 : URL avec encodage complet
const url2 = `${supabaseUrl}/storage/v1/object/public/attachments/${encodeURIComponent(filePath)}`;
console.log('URL 2 (encodage complet):', url2);

// Test 3 : URL avec encodage par segment
const url3 = `${supabaseUrl}/storage/v1/object/public/attachments/${filePath
  .split('/')
  .map(s => encodeURIComponent(s))
  .join('/')}`;
console.log('URL 3 (encodage par segment):', url3);

// Tester chaque URL
[url1, url2, url3].forEach((url, index) => {
  fetch(url, { method: 'HEAD' })
    .then(response => {
      console.log(`✅ URL ${index + 1} - Status: ${response.status}`, url);
      if (response.ok) {
        console.log('✅ Cette URL fonctionne !');
      }
    })
    .catch(error => {
      console.error(`❌ URL ${index + 1} - Error:`, error);
    });
});
```

## 🔍 Vérifier avec Supabase Client

```javascript
// Dans la console du navigateur
import('@/integrations/supabase/client').then(({ supabase }) => {
  const filePath = 'vendor-message-attachments/1765207968982-y0xu1n9lneq.png';

  // Test 1 : getPublicUrl
  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
  console.log('getPublicUrl result:', urlData);

  // Test 2 : Vérifier si le fichier existe
  supabase.storage
    .from('attachments')
    .list('vendor-message-attachments', {
      search: '1765207968982-y0xu1n9lneq.png',
    })
    .then(({ data, error }) => {
      console.log('File exists check:', { data, error });
    });
});
```
