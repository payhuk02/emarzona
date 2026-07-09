import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Users\\pc\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  await page.goto('http://localhost:8081/dashboard/digital-products', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
