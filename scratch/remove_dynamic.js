
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const files = walk(apiDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("export const dynamic = 'force-dynamic';")) {
        console.log(`Removing force-dynamic from ${file}`);
        content = content.replace("export const dynamic = 'force-dynamic';\n", "");
        content = content.replace("export const dynamic = 'force-dynamic';", "");
        fs.writeFileSync(file, content, 'utf8');
    }
});
