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
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const files = walk(apiDir);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let openBraces = 0;
    let inTry = false;
    
    // Simple check: count occurrences of "catch (error)" and "try {"
    const tryCount = (content.match(/try\s*\{/g) || []).length;
    const catchCount = (content.match(/catch\s*\(error\)/g) || []).length;
    
    if (tryCount < catchCount) {
        console.log(`[POTENTIAL ERROR] ${file}: try count (${tryCount}) < catch count (${catchCount})`);
    }

    // Check for " } catch (error) {" without a preceding "try" block closure or something similar
    // This is hard with regex, so let's just look for files where catch (error) appears but try { is missing in the same function scope
});
