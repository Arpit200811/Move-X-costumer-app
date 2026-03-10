const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let oldContent = content;
            
            // Replace: t('key') || 'Fallback' -> t('key', 'Fallback')
            content = content.replace(/t\('([^']+)'\)\s*\|\|\s*'([^']+)'/g, "t('$1', '$2')");
            content = content.replace(/t\("([^"]+)"\)\s*\|\|\s*"([^"]+)"/g, 't("$1", "$2")');
            content = content.replace(/t\('([^']+)'\)\s*\|\|\s*"([^"]+)"/g, "t('$1', \"$2\")");
            content = content.replace(/t\("([^"]+)"\)\s*\|\|\s*'([^']+)'/g, "t(\"$1\", '$2')");
            
            if (oldContent !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated i18n fallbacks in ${fullPath}`);
            }
        }
    }
}
processDir('./src');
console.log('Done!');
