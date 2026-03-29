const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  
  // Wait for 3 seconds for Spline to load completely
  await new Promise(r => setTimeout(r, 4000));
  
  const bodyContent = await page.evaluate(() => {
    return document.body.innerHTML; 
  });
  
  const fs = require('fs');
  fs.writeFileSync('output.html', bodyContent);
  console.log("Written DOM to output.html");
  
  await browser.close();
})();
