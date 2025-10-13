import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  email: string;
  phone: string;
  createdAt: Date;
  isAdmin: boolean;
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>({ enabled: false, message: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile({
            email: data.email,
            phone: data.phone,
            createdAt: data.createdAt?.toDate() || new Date(),
            isAdmin: data.isAdmin || false,
          });
        }
        setIsGuest(false);
      } else {
        setUserProfile(null);
        const guestMode = await AsyncStorage.getItem('guest_mode');
        setIsGuest(guestMode === 'true');
      }
      
      setLoading(false);
    });

    loadMaintenanceMode();

    return unsubscribe;
  }, []);

  const loadMaintenanceMode = async () => {
    try {
      const maintenanceDoc = await getDoc(doc(db, 'settings', 'maintenance'));
      if (maintenanceDoc.exists()) {
        const data = maintenanceDoc.data();
        setMaintenanceMode({
          enabled: data.enabled || false,
          message: data.message || 'Service temporarily unavailable',
        });
      }
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    }
  };

  const register = useCallback(async (email: string, password: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const isAdmin = email === 'kevinspot@gmail.com';
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        phone,
        createdAt: new Date(),
        isAdmin,
      });

      console.log('User registered successfully');
      return userCredential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.removeItem('guest_mode');
      console.log('User signed in successfully');
      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('guest_mode');
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem('guest_mode', 'true');
    setIsGuest(true);
    console.log('Continuing as guest');
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdateEmail(user, newEmail);
      await setDoc(doc(db, 'users', user.uid), { email: newEmail }, { merge: true });
      console.log('Email updated successfully');
    } catch (error: any) {
      console.error('Update email error:', error);
      throw new Error(error.message || 'Failed to update email');
    }
  }, [user]);

  const updateUserPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
      console.log('Password updated successfully');
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }, [user]);

  const deleteAccount = useCallback(async (password: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, 'users', user.uid));
      await firebaseDeleteUser(user);
      console.log('Account deleted successfully');
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }, [user]);

  const getAllUsers = useCallback(async () => {
    if (!userProfile?.isAdmin) throw new Error('Unauthorized');
    
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.message || 'Failed to get users');
    }
  }, [userProfile]);

  const setMaintenanceModeAdmin = useCallback(async (enabled: boolean, message: string) => {
    if (!userProfile?.isAdmin) throw new Error('Unauthorized');
    
    try {
      await setDoc(doc(db, 'settings', 'maintenance'), {
        enabled,
        message,
        updatedAt: new Date(),
      });
      setMaintenanceMode({ enabled, message });
      console.log('Maintenance mode updated');
    } catch (error: any) {
      console.error('Set maintenance mode error:', error);
      throw new Error(error.message || 'Failed to update maintenance mode');
    }
  }, [userProfile]);

  return useMemo(() => ({
    user,
    userProfile,
    isGuest,
    loading,
    maintenanceMode,
    register,
    signIn,
    signOut,
    continueAsGuest,
    updateUserEmail,
    updateUserPassword,
    deleteAccount,
    getAllUsers,
    setMaintenanceModeAdmin,
  }), [user, userProfile, isGuest, loading, maintenanceMode, register, signIn, signOut, continueAsGuest, updateUserEmail, updateUserPassword, deleteAccount, getAllUsers, setMaintenanceModeAdmin]);
});
