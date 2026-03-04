const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

    console.log("Navigating to http://localhost:5173...");
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 5000 });
    } catch (e) {
        console.log("Navigation finished or timed out.");
    }

    await browser.close();
})();
