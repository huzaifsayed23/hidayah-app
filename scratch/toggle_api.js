
const fs = require('fs');
const path = require('path');

const apiPath = path.join(process.cwd(), 'src', 'app', 'api');
const hiddenPath = path.join(process.cwd(), 'src', 'app', '_api');

const action = process.argv[2];

function move(src, dest) {
    if (!fs.existsSync(src)) return;
    try {
        // Try rename first
        fs.renameSync(src, dest);
    } catch (e) {
        if (e.code === 'EPERM' || e.code === 'EACCES') {
            console.log(`Rename failed (${e.code}), trying copy/delete...`);
            fs.cpSync(src, dest, { recursive: true });
            fs.rmSync(src, { recursive: true, force: true });
        } else {
            throw e;
        }
    }
}

if (action === 'hide') {
    if (fs.existsSync(apiPath)) {
        move(apiPath, hiddenPath);
        console.log('API directory hidden for mobile build.');
    } else {
        console.log('API directory already hidden or not found.');
    }
} else if (action === 'restore') {
    if (fs.existsSync(hiddenPath)) {
        move(hiddenPath, apiPath);
        console.log('API directory restored.');
    } else {
        console.log('API directory already restored or not found.');
    }
} else {
    console.log('Usage: node toggle-api.js [hide|restore]');
}
