const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set up console listener
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT ERROR:', error.message);
  });

  try {
    // Go to the local dev server
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // We might need to login since we wiped the DB
    console.log("Page loaded. If it's a blank screen, the error should have been printed above.");
  } catch (e) {
    console.log("Script error:", e);
  }
  
  await browser.close();
})();
