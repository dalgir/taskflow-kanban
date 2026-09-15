import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app';

import {
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';

import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
};

export const getFirebaseConfigurationIssues = (): string[] => {
  const issues: string[] = [];

  if (!firebaseConfig.apiKey) {
    issues.push('VITE_FIREBASE_API_KEY ausente');
  }

  if (!firebaseConfig.authDomain) {
    issues.push('VITE_FIREBASE_AUTH_DOMAIN ausente');
  }

  if (!firebaseConfig.projectId) {
    issues.push('VITE_FIREBASE_PROJECT_ID ausente');
  }

  if (!firebaseConfig.appId) {
    issues.push('VITE_FIREBASE_APP_ID ausente');
  }

  return issues;
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // Cache dos documentos apenas em memória.
    // Não habilita persistência offline em disco.
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });

    // A sessão de autenticação continua sendo gerenciada pelo Firebase.
    auth = getAuth(app);

    void setPersistence(auth, browserLocalPersistence).catch(
      (error: unknown) => {
        console.error(
          'Não foi possível configurar a persistência do Firebase Auth:',
          error
        );
      }
    );

    console.info('Firebase inicializado com cache em memória.');
  } catch (error: unknown) {
    console.error('Erro ao inicializar o Firebase:', error);
  }
} else {
  console.warn(
    'Firebase não configurado. Verifique as variáveis de ambiente.'
  );
}

export { app, db, auth };