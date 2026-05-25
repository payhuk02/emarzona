SELECT id, status_code, left(content::text, 300) AS content_preview, created
FROM net._http_response
ORDER BY created DESC
LIMIT 8;
