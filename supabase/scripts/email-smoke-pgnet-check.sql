SELECT count(*)::int AS recent_200_count
FROM net._http_response
WHERE created > now() - interval '3 hours'
  AND status_code = 200
  AND (
    content::text LIKE '%No emails to send%'
    OR content::text LIKE '%"processed":0%'
    OR content::text LIKE '%"processed": 0%'
    OR content::text LIKE '%"success":true%'
  );
