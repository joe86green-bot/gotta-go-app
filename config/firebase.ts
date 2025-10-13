import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBf9sIRT4XpPUyopJqYZ1oyHKVEuIPrpHk",
  authDomain: "gotta-go-36fa1.firebaseapp.com",
  projectId: "gotta-go-36fa1",
  storageBucket: "gotta-go-36fa1.firebasestorage.app",
  messagingSenderId: "424394620127",
  appId: "1:424394620127:web:8383d0839c1d770f487d6a",
  measurementId: "G-RSVBLSN1TD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;
