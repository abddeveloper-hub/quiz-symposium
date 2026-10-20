const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.txt')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('/_next/')) {
        content = content.replaceAll('/_next/', '/next_assets/');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy _next to next_assets in out and in root
if (fs.existsSync('./out/_next')) {
  copyDir('./out/_next', './out/next_assets');
  copyDir('./out/_next', './next_assets');
}

// 2. Replace /_next/ references with /next_assets/ in out
replaceInDir('./out');

// 3. Ensure root HTML files are updated
['index.html', 'admin.html', 'admin/index.html'].forEach((f) => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replaceAll('/_next/', '/next_assets/');
    fs.writeFileSync(f, content, 'utf8');
  }
});

// 4. Ensure .nojekyll exists
fs.writeFileSync('.nojekyll', '', 'utf8');
if (fs.existsSync('./out')) {
  fs.writeFileSync('./out/.nojekyll', '', 'utf8');
}

console.log('✓ Successfully prepared GitHub Pages assets with next_assets prefix!');
