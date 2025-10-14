import { useState, useEffect, useMemo, useCallback } from 'react';
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
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  email: string;
  phone: string;
  createdAt: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  register: (email: string, password: string, phone: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (newPassword: string, currentPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
  continueAsGuest: () => void;
  getAllUsers: () => Promise<{ email: string; phone: string; createdAt: string }[]>;
  getUserCount: () => Promise<number>;
}

const ADMIN_EMAIL = 'kevinspot@gmail.com';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loadGuestStatus = async () => {
      try {
        const guestStatus = await AsyncStorage.getItem('isGuest');
        if (guestStatus === 'true') {
          setIsGuest(true);
        }
      } catch (error) {
        console.error('Error loading guest status:', error);
      }
    };
    loadGuestStatus();
  }, []);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email || 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log('📄 Loading user profile for:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            console.log('✅ User profile loaded:', profile.email, 'isAdmin:', profile.isAdmin);
          } else {
            console.warn('⚠️ User document does not exist for:', firebaseUser.uid);
          }
        } catch (error: any) {
          console.error('❌ Error loading user profile:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);
        }
        setIsGuest(false);
        await AsyncStorage.setItem('isGuest', 'false');
      } else {
        console.log('👤 No user logged in');
        setUserProfile(null);
      }
      
      console.log('✅ Auth state processing complete, setting isLoading to false');
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = useCallback(async (email: string, password: string, phone: string) => {
    try {
      console.log('📝 Starting registration for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase auth user created:', userCredential.user.uid);
      
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const userProfile: UserProfile = {
        email,
        phone,
        createdAt: new Date().toISOString(),
        isAdmin,
      };

      console.log('💾 Saving user profile to Firestore...');
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      console.log('✅ User profile created in Firestore:', email, 'isAdmin:', isAdmin);
      
      setUserProfile(userProfile);
      console.log('✅ Registration complete!');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      throw new Error(error.message || 'Failed to register');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔑 Starting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase auth successful:', userCredential.user.uid);
      
      console.log('📄 Loading user profile from Firestore...');
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        console.log('✅ User logged in:', profile.email, 'isAdmin:', profile.isAdmin);
      } else {
        console.warn('⚠️ User profile not found in Firestore');
      }
      
      setIsGuest(false);
      console.log('✅ Login complete!');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      throw new Error(error.message || 'Failed to login');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setIsGuest(false);
      await AsyncStorage.setItem('isGuest', 'false');
      console.log('User logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updateEmail(user, newEmail);
      
      await setDoc(doc(db, 'users', user.uid), {
        email: newEmail,
      }, { merge: true });
      
      if (userProfile) {
        setUserProfile({ ...userProfile, email: newEmail });
      }
    } catch (error: any) {
      console.error('Update email error:', error);
      throw new Error(error.message || 'Failed to update email');
    }
  }, [user, userProfile]);

  const updateUserPassword = useCallback(async (newPassword: string, currentPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }, [user]);

  const deleteAccount = useCallback(async (currentPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await deleteUser(user);
      setUserProfile(null);
      setIsGuest(false);
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }, [user]);

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true);
    setIsLoading(false);
    await AsyncStorage.setItem('isGuest', 'true');
  }, []);

  const getAllUsers = useCallback(async (): Promise<{ email: string; phone: string; createdAt: string }[]> => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          email: data.email || '',
          phone: data.phone || '',
          createdAt: data.createdAt || '',
        };
      });
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }, []);

  const getUserCount = useCallback(async (): Promise<number> => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.size;
    } catch (error) {
      console.error('Error getting user count:', error);
      throw error;
    }
  }, []);

  const isAdmin = useMemo(() => {
    return userProfile?.isAdmin === true;
  }, [userProfile]);

  return useMemo(() => ({
    user,
    userProfile,
    isLoading,
    isGuest,
    isAdmin,
    register,
    login,
    logout,
    updateUserEmail,
    updateUserPassword,
    deleteAccount,
    continueAsGuest,
    getAllUsers,
    getUserCount,
  }), [user, userProfile, isLoading, isGuest, isAdmin, register, login, logout, updateUserEmail, updateUserPassword, deleteAccount, continueAsGuest, getAllUsers, getUserCount]);
});
