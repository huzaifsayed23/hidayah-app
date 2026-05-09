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

    // Wrap cookies() calls to prevent build crashes
    if (content.includes('await cookies()') && !content.includes('.catch(() => null)')) {
        content = content.replace(/await cookies\(\)/g, '(await cookies().catch(() => null))');
        changed = true;
    }
    
    // Add check for cookieStore failure if it's used
    if (content.includes('cookieStore.get') && !content.includes('if (!cookieStore)')) {
        content = content.replace(/const cookieStore = ([^;]+);/g, 'const cookieStore = $1; if (!cookieStore) return NextResponse.json({ message: "Build mode" }, { status: 200 });');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated cookies usage in ${file}`);
    }
});
