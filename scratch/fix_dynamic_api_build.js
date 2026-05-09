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

    // Check if it's a dynamic route
    const isDynamic = file.includes('[') && file.includes(']');

    if (isDynamic) {
        // Extract parameter name
        const paramMatch = file.match(/\[([^\]]+)\]/);
        const paramName = paramMatch ? paramMatch[1] : 'id';
        
        const gsp = `export function generateStaticParams() { return [{ '${paramName}': '${paramName}' }]; }\n`;
        
        if (content.includes('generateStaticParams() { return []; }')) {
            content = content.replace('generateStaticParams() { return []; }', `generateStaticParams() { return [{ '${paramName}': '${paramName}' }]; }`);
            changed = true;
        } else if (!content.includes('generateStaticParams')) {
            content = gsp + content;
            changed = true;
        }
    } else {
        // Not dynamic, but might still need it if Next.js complains?
        // Usually not needed for non-dynamic routes.
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated dynamic params in ${file}`);
    }
});
