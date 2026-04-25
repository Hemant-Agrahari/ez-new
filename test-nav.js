const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');
  
  await page.waitForLoadState('networkidle');
  
  const result = await page.evaluate(() => {
    const toggle = document.querySelector('a[href="#collapseCompany"]');
    if (!toggle) return 'Toggle not found';
    
    const parent = toggle.parentElement;
    const desktopMenu = parent.querySelector('.dropdown-menu');
    
    toggle.click();
    
    return {
      toggleFound: !!toggle,
      parentClass: parent.className,
      desktopMenuFound: !!desktopMenu,
      desktopMenuHasShow: desktopMenu ? desktopMenu.classList.contains('show') : false
    };
  });
  
  console.log('Result:', result);
  
  await browser.close();
})();
