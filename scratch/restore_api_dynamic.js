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

    // Restore force-dynamic
    if (content.includes('force-static')) {
        content = content.replace(/force-static/g, 'force-dynamic');
        changed = true;
    }

    // Remove build-time hacks
    if (content.includes('generateStaticParams')) {
        content = content.replace(/export function generateStaticParams\(\) \{[\s\S]*?\}\n?/g, '');
        changed = true;
    }
    if (content.includes('export const dynamicParams = false;')) {
        content = content.replace(/export const dynamicParams = false;\n?/g, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Restored dynamic behavior in ${file}`);
    }
});
