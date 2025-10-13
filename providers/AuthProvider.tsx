import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAppleSignInAvailable(available);
      }
    };
    checkAppleSignIn();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setIsGuest(false);
        const storedPhone = await AsyncStorage.getItem(`phone_${firebaseUser.uid}`);
        setPhoneNumber(storedPhone);
      } else {
        const guestMode = await AsyncStorage.getItem('guest_mode');
        setIsGuest(guestMode === 'true');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email: string, password: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem(`phone_${userCredential.user.uid}`, phone);
      setPhoneNumber(phone);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        phoneNumber: phone,
        createdAt: serverTimestamp(),
        uid: userCredential.user.uid,
      });
      
      await AsyncStorage.removeItem('guest_mode');
      console.log('User signed up:', userCredential.user.email);
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            throw new Error('This email is already registered. Please sign in instead.');
          case 'auth/invalid-email':
            throw new Error('Invalid email address.');
          case 'auth/weak-password':
            throw new Error('Password is too weak. Please use a stronger password.');
          default:
            throw new Error(firebaseError.message || 'Failed to create account.');
        }
      }
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const storedPhone = await AsyncStorage.getItem(`phone_${userCredential.user.uid}`);
      setPhoneNumber(storedPhone);
      await AsyncStorage.removeItem('guest_mode');
      console.log('User signed in:', userCredential.user.email);
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            throw new Error('Invalid email or password.');
          case 'auth/invalid-email':
            throw new Error('Invalid email address.');
          case 'auth/too-many-requests':
            throw new Error('Too many failed attempts. Please try again later.');
          default:
            throw new Error(firebaseError.message || 'Failed to sign in.');
        }
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setPhoneNumber(null);
      setIsGuest(false);
      await AsyncStorage.removeItem('guest_mode');
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    try {
      await AsyncStorage.setItem('guest_mode', 'true');
      setIsGuest(true);
      console.log('Continuing as guest');
    } catch (error) {
      console.error('Guest mode error:', error);
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
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
      await AsyncStorage.removeItem('guest_mode');
      console.log('User signed in with Apple:', userCredential.user.email);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const appleError = error as { code: string };
        if (appleError.code === 'ERR_REQUEST_CANCELED') {
          console.log('Apple sign in canceled');
          return;
        }
      }
      console.error('Apple sign in error:', error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      console.log('Email updated successfully');
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  }, [user]);

  const updateUserPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      console.log('Password updated successfully');
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }, [user]);

  const deleteAccount = useCallback(async (password: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      if (user.uid) {
        await AsyncStorage.removeItem(`phone_${user.uid}`);
      }
      
      await deleteUser(user);
      console.log('Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, [user]);

  return useMemo(() => ({
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
  }), [user, isGuest, loading, signUp, signIn, signInWithApple, resetPassword, logout, continueAsGuest, updateUserEmail, updateUserPassword, deleteAccount, phoneNumber, isAppleSignInAvailable]);
});
