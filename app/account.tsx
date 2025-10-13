import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Mail, Phone, Lock, LogOut, Trash2, X, Shield } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

type EditMode = 'email' | 'password' | 'delete' | null;

export default function AccountScreen() {
  const { user, userProfile, signOut, updateUserEmail, updateUserPassword, deleteAccount } = useAuth();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleUpdateEmail = async () => {
    Keyboard.dismiss();
    
    if (!newEmail || !currentPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await updateUserEmail(newEmail, currentPassword);
      Alert.alert('Success', 'Email updated successfully');
      setEditMode(null);
      setNewEmail('');
      setCurrentPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setEditMode(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Keyboard.dismiss();
    
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount(currentPassword);
              Alert.alert('Success', 'Account deleted successfully');
              router.replace('/auth');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setEditMode(null);
    setNewEmail('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptyDescription}>Please log in to view your account</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Mail size={20} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userProfile.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode('email')}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Phone size={20} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userProfile.phone}</Text>
              </View>
            </View>

            {userProfile.isAdmin && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Shield size={20} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={[styles.infoValue, { color: COLORS.primary }]}>Administrator</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setEditMode('password')}
          >
            <Lock size={20} color={COLORS.text} />
            <Text style={styles.actionText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleSignOut}>
            <LogOut size={20} color={COLORS.text} />
            <Text style={styles.actionText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.dangerCard]}
            onPress={() => setEditMode('delete')}
          >
            <Trash2 size={20} color={COLORS.danger} />
            <Text style={[styles.actionText, styles.dangerText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {userProfile.isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
            >
              <Shield size={20} color="#fff" />
              <Text style={styles.adminButtonText}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode === 'email' && 'Update Email'}
                  {editMode === 'password' && 'Change Password'}
                  {editMode === 'delete' && 'Delete Account'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {editMode === 'email' && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="New Email"
                      placeholderTextColor="#999"
                      value={newEmail}
                      onChangeText={setNewEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Current Password"
                      placeholderTextColor="#999"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleUpdateEmail}
                    />
                  </>
                )}

                {editMode === 'password' && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Current Password"
                      placeholderTextColor="#999"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      placeholderTextColor="#999"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleUpdatePassword}
                    />
                  </>
                )}

                {editMode === 'delete' && (
                  <>
                    <Text style={styles.warningText}>
                      This action cannot be undone. All your data will be permanently deleted.
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Password to Confirm"
                      placeholderTextColor="#999"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleDeleteAccount}
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    editMode === 'delete' && styles.dangerButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={() => {
                    if (editMode === 'email') handleUpdateEmail();
                    else if (editMode === 'password') handleUpdatePassword();
                    else if (editMode === 'delete') handleDeleteAccount();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {editMode === 'email' && 'Update Email'}
                      {editMode === 'password' && 'Change Password'}
                      {editMode === 'delete' && 'Delete Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  actionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  dangerText: {
    color: COLORS.danger,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  adminButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  modalBody: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold' as const,
  },
});
