
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
            results.push(file);
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const files = walk(apiDir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Remove the specific corruption line
    const lines = content.split('\n');
    const newLines = lines.filter(line => line.trim() !== ']; }');
    
    if (lines.length !== newLines.length) {
        content = newLines.join('\n');
        fs.writeFileSync(file, content);
        console.log(`Fixed: ${file}`);
    }
});
