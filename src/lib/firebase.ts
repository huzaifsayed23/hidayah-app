import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let app: admin.app.App;

if (!admin.apps.length) {
  try {
    let credential;
    
    // Check if we are running locally and have the file
    const localKeyPath = path.join(process.cwd(), 'firebase-admin.json');
    if (fs.existsSync(localKeyPath)) {
      const fileContent = fs.readFileSync(localKeyPath, 'utf8');
      credential = admin.credential.cert(JSON.parse(fileContent));
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Use environment variables for Vercel production
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    if (credential) {
      app = admin.initializeApp({ credential });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin skipped: No credentials found.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
} else {
  app = admin.app();
}

export const messaging = admin.apps.length ? admin.messaging() : null;
