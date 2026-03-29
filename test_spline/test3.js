const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  
  // Wait for 5 seconds
  await new Promise(r => setTimeout(r, 5000));
  
  const logoInfo = await page.evaluate(() => {
    // Find any element containing "Built with Spline" text
    const elements = Array.from(document.querySelectorAll('*'));
    let found = [];
    for(let el of elements) {
      if(el.textContent && el.textContent.includes('Built with Spline') && el.children.length === 0) {
        found.push({tag: el.tagName, class: el.className, id: el.id, html: el.outerHTML, parentTag: el.parentElement ? el.parentElement.tagName : 'none'});
      }
      if(el.alt && el.alt.includes('Spline')) {
        found.push({tag: el.tagName, alt: el.alt, html: el.outerHTML});
      }
    }
    
    // Also check if any A tag has spline.design
    const links = Array.from(document.querySelectorAll('a'));
    for(let a of links) {
      if(a.href && a.href.includes('spline')) {
        found.push({tag: 'A', href: a.href, html: a.outerHTML});
      }
    }
    return found;
  });
  
  console.log("Found logo elements:", JSON.stringify(logoInfo, null, 2));
  await browser.close();
})();
