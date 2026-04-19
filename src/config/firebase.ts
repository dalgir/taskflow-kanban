import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey
    && firebaseConfig.authDomain
    && firebaseConfig.projectId
    && firebaseConfig.appId
  );
};

export const getFirebaseConfigurationIssues = (): string[] => {
  const issues: string[] = [];

  if (!firebaseConfig.apiKey) issues.push('VITE_FIREBASE_API_KEY ausente');
  if (!firebaseConfig.authDomain) issues.push('VITE_FIREBASE_AUTH_DOMAIN ausente');
  if (!firebaseConfig.projectId) issues.push('VITE_FIREBASE_PROJECT_ID ausente');
  if (!firebaseConfig.appId) issues.push('VITE_FIREBASE_APP_ID ausente');

  return issues;
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    void setPersistence(auth, browserLocalPersistence).catch(error => {
      console.error('Não foi possível configurar a persistência do Firebase Auth:', error);
    });
    console.log('✅ Firebase conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar Firebase:', error);
  }
} else {
  console.warn('ℹ️ Firebase não configurado. O sistema ficará em modo local de demonstração.');
}

export { app, db, auth };
