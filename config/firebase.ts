import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCJlEJDm5b9sjbHLZ0XyFTyZHcRQ4tA8Hw",
  authDomain: "gottago-831ca.firebaseapp.com",
  projectId: "gottago-831ca",
  storageBucket: "gottago-831ca.firebasestorage.app",
  messagingSenderId: "721047577523",
  appId: "1:721047577523:web:ede1a07db16a03ea3121c6"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
}

export { auth, db };
