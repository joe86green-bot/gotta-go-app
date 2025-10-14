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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            console.log('User profile loaded:', profile.email, 'isAdmin:', profile.isAdmin);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
        setIsGuest(false);
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = useCallback(async (email: string, password: string, phone: string) => {
    try {
      console.log('Registering user:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const userProfile: UserProfile = {
        email,
        phone,
        createdAt: new Date().toISOString(),
        isAdmin,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      console.log('User profile created:', email, 'isAdmin:', isAdmin);
      
      setUserProfile(userProfile);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Logging in user:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        console.log('User logged in:', profile.email, 'isAdmin:', profile.isAdmin);
      }
      
      setIsGuest(false);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setIsGuest(false);
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

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    setIsLoading(false);
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
