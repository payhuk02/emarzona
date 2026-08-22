SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'kyc-documents' OR name ILIKE '%kyc%';
