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

    // Remove force-dynamic
    if (content.includes("export const dynamic = 'force-dynamic';")) {
        content = content.replace(/export const dynamic = 'force-dynamic';\n?/g, '');
        changed = true;
    }

    // Wrap cookies().set in try/catch if it exists
    if (content.includes('cookieStore.set')) {
        // Simple regex to wrap the block
        content = content.replace(/(if \(cookieStore\) \{[\s\S]*?cookieStore\.set[\s\S]*?\})/g, 'try { $1 } catch (e) {}');
        changed = true;
    }

    // Ensure generateStaticParams is present for ALL routes to satisfy 'output: export'
    if (!content.includes('generateStaticParams')) {
        content = "export function generateStaticParams() { return []; }\n" + content;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
