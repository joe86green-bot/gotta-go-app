import { useEffect, useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  OAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  signUp: (email: string, password: string, phoneNumber: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  phoneNumber: string | null;
  isAppleSignInAvailable: boolean;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkAppleSignIn = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleSignInAvailable(available);
        } catch (error) {
          console.log('Apple sign in not available:', error);
          setIsAppleSignInAvailable(false);
        }
      }
    };
    checkAppleSignIn();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setIsGuest(false);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setPhoneNumber(userData.phoneNumber || null);
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      } else {
        try {
          const guestMode = await AsyncStorage.getItem('guest_mode');
          setIsGuest(guestMode === 'true');
        } catch (error) {
          console.log('Error checking guest mode:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email: string, password: string, phone: string) => {
    console.log('Starting sign up...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user.uid);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      phoneNumber: phone,
      createdAt: new Date().toISOString(),
      uid: userCredential.user.uid,
    });
    console.log('User data saved');
    
    setPhoneNumber(phone);
    await AsyncStorage.removeItem('guest_mode');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Starting sign in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setPhoneNumber(userData.phoneNumber || null);
    }
    
    await AsyncStorage.removeItem('guest_mode');
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setPhoneNumber(null);
    setIsGuest(false);
    await AsyncStorage.removeItem('guest_mode');
    console.log('User logged out');
  }, []);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem('guest_mode', 'true');
    setIsGuest(true);
    console.log('Continuing as guest');
  }, []);

  const signInWithApple = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken } = credential;
    if (!identityToken) {
      throw new Error('No identity token returned from Apple');
    }

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: identityToken,
    });

    const userCredential = await signInWithCredential(auth, firebaseCredential);
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        uid: userCredential.user.uid,
      });
    }
    
    await AsyncStorage.removeItem('guest_mode');
    console.log('User signed in with Apple');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);
    console.log('Email updated');
  }, [user]);

  const updateUserPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    console.log('Password updated');
  }, [user]);

  const deleteAccount = useCallback(async (password: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
    console.log('Account deleted');
  }, [user]);

  return {
    user,
    isGuest,
    loading,
    signUp,
    signIn,
    signInWithApple,
    resetPassword,
    logout,
    continueAsGuest,
    updateUserEmail,
    updateUserPassword,
    deleteAccount,
    phoneNumber,
    isAppleSignInAvailable,
  };
});
