const fs = require('fs');
const path = require('path');

try {
  const distDir = path.join(__dirname, 'dist');
  const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
  
  if (!fs.existsSync(jsDir)) {
    console.warn('[Post Build] JS web directory does not exist yet.');
    process.exit(0);
  }

  const files = fs.readdirSync(jsDir);
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

  if (jsFile) {
    const htmlPath = path.join(distDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Replace the script tag dynamically
      const regex = /src="\/_expo\/static\/js\/web\/index-.*?\.js"/;
      const originalHtml = html;
      html = html.replace(regex, `src="/_expo/static/js/web/${jsFile}"`);
      
      if (originalHtml !== html) {
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`[Post Build] Successfully updated script reference to ${jsFile}`);
      } else {
        // Fallback search if the regex didn't match (e.g. single quotes or space variations)
        const fallbackRegex = /src=['"]\/_expo\/static\/js\/web\/index-.*?\.js['"]/;
        html = html.replace(fallbackRegex, `src="/_expo/static/js/web/${jsFile}"`);
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`[Post Build] Updated script reference via fallback to ${jsFile}`);
      }
    } else {
      console.error('[Post Build] index.html not found in dist/.');
    }
  } else {
    console.error('[Post Build] No index-*.js bundle found.');
  }
} catch (e) {
  console.error('[Post Build] Failed to run post-build hook:', e);
}
