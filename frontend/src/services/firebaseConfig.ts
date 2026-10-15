import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'baja_gralha_firebase_config';
const USE_FIREBASE_KEY = 'baja_gralha_use_firebase';

// Obtém configuração padrão das variáveis de ambiente Vite (.env) ou de valores salvos no localStorage
export function getSavedFirebaseConfig(): FirebaseConfigParams | null {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler configuração Firebase do localStorage:', e);
  }

  // Lê do arquivo .env de forma estática direta (exigência do Vite em compilações de produção)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId && apiKey) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigParams | null): void {
  if (config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(USE_FIREBASE_KEY, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USE_FIREBASE_KEY);
  }
}

export function isFirebaseEnabled(): boolean {
  const userPref = localStorage.getItem(USE_FIREBASE_KEY);
  if (userPref === 'false') return false;
  return Boolean(getSavedFirebaseConfig());
}

export function setFirebaseEnabled(enabled: boolean): void {
  localStorage.setItem(USE_FIREBASE_KEY, enabled ? 'true' : 'false');
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseInstances(): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } {
  const config = getSavedFirebaseConfig();
  if (!config || !isFirebaseEnabled()) {
    return { app: null, db: null, auth: null };
  }

  try {
    if (!cachedApp) {
      const apps = getApps();
      cachedApp = apps.length > 0 ? getApp() : initializeApp(config);
    }
    if (!cachedDb && cachedApp) {
      cachedDb = getFirestore(cachedApp);
    }
    if (!cachedAuth && cachedApp) {
      cachedAuth = getAuth(cachedApp);
    }
    return { app: cachedApp, db: cachedDb, auth: cachedAuth };
  } catch (err) {
    console.error('Falha ao inicializar Firebase:', err);
    return { app: null, db: null, auth: null };
  }
}

export function resetFirebaseInstance(): void {
  cachedApp = null;
  cachedDb = null;
  cachedAuth = null;
}
