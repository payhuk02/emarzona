import http from 'http';
http.get('http://localhost:8081/src/pages/digital/DigitalProductsList.tsx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, '\nData:', data.slice(0, 500)));
}).on('error', err => console.error(err));
