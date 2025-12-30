import * as admin from 'firebase-admin';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

try {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: Use environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Development: Use local file
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    credential = admin.credential.cert(serviceAccountPath);
  }

  admin.initializeApp({
    credential
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

export const db = admin.firestore();
