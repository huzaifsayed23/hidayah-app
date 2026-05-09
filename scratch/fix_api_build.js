const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('route.ts')) results.push(file);
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'src/app/api');
const files = getFiles(apiDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Ensure generateStaticParams exists
    if (!content.includes('generateStaticParams')) {
        content = `export function generateStaticParams() { return []; }\n` + content;
        changed = true;
    }

    // Ensure dynamic is set to force-static for build
    if (content.includes('force-dynamic')) {
        content = content.replace('force-dynamic', 'force-static');
        changed = true;
    } else if (!content.includes('export const dynamic')) {
        content = `export const dynamic = 'force-static';\n` + content;
        changed = true;
    }
    
    // Ensure dynamicParams is set to false to prevent dynamic rendering
    if (!content.includes('export const dynamicParams')) {
        content = `export const dynamicParams = false;\n` + content;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
