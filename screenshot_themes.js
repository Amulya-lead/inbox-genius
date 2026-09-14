const puppeteer = require('puppeteer');
const path = require('path');

const THEMES = ['cosmic','matrix','sunset','ocean','rose','electric'];
const OUT = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\b5b22b21-a1f6-4a8e-80b9-5275bea743d6';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  for (const theme of THEMES) {
    // Click the theme button by finding text
    await page.evaluate((name) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.toLowerCase().includes(name));
      if (btn) btn.click();
    }, theme);

    await new Promise(r => setTimeout(r, 800));
    const file = path.join(OUT, `theme_${theme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✅ Saved: theme_${theme}.png`);
  }

  await browser.close();
  console.log('Done!');
})();
