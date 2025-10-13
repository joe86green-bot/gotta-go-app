import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, LogOut, Trash2, Mail, Lock, Phone, X, Shield } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useAdmin, checkIsAdmin } from '@/providers/AdminProvider';

type ModalType = 'email' | 'password' | 'delete' | 'admin' | null;

export default function ProfileScreen() {
  const { user, logout, updateUserEmail, updateUserPassword, deleteAccount, phoneNumber } = useAuth();
  const { settings, updateSettings } = useAdmin();
  const [modalVisible, setModalVisible] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = checkIsAdmin(user?.email);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [deletePassword, setDeletePassword] = useState('');

  const [schedulingDisabled, setSchedulingDisabled] = useState(settings.schedulingDisabled);
  const [disabledMessage, setDisabledMessage] = useState(settings.disabledMessage);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/welcome');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await updateUserEmail(newEmail, emailPassword);
      Alert.alert('Success', 'Email updated successfully');
      setModalVisible(null);
      setNewEmail('');
      setEmailPassword('');
    } catch (error: unknown) {
      console.error('Update email error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update email';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
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
      setModalVisible(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: unknown) {
      console.error('Update password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
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
              await deleteAccount(deletePassword);
              Alert.alert('Success', 'Account deleted successfully');
              router.replace('/welcome');
            } catch (error: unknown) {
              console.error('Delete account error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
              setModalVisible(null);
              setDeletePassword('');
            }
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(null);
    setNewEmail('');
    setEmailPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDeletePassword('');
    setSchedulingDisabled(settings.schedulingDisabled);
    setDisabledMessage(settings.disabledMessage);
  };

  const handleUpdateAdminSettings = async () => {
    setLoading(true);
    try {
      await updateSettings({
        schedulingDisabled,
        disabledMessage,
      });
      Alert.alert('Success', 'Admin settings updated successfully');
      setModalVisible(null);
    } catch (error: unknown) {
      console.error('Update admin settings error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          {phoneNumber && (
            <View style={styles.phoneContainer}>
              <Phone size={16} color={COLORS.textSecondary} />
              <Text style={styles.phone}>{phoneNumber}</Text>
            </View>
          )}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Controls</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setModalVisible('admin')}
            >
              <View style={[styles.settingIcon, styles.adminIcon]}>
                <Shield size={20} color={COLORS.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Scheduling Controls</Text>
                <Text style={styles.settingDescription}>
                  {settings.schedulingDisabled ? 'Scheduling is disabled' : 'Scheduling is enabled'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setModalVisible('email')}
          >
            <View style={styles.settingIcon}>
              <Mail size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Email</Text>
              <Text style={styles.settingDescription}>Update your email address</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setModalVisible('password')}
          >
            <View style={styles.settingIcon}>
              <Lock size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your password</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={[styles.settingIcon, styles.logoutIcon]}>
              <LogOut size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Logout</Text>
              <Text style={styles.settingDescription}>Sign out of your account</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setModalVisible('delete')}
          >
            <View style={[styles.settingIcon, styles.deleteIcon]}>
              <Trash2 size={20} color="#ff3b30" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.deleteText]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalVisible === 'email' && 'Change Email'}
                {modalVisible === 'password' && 'Change Password'}
                {modalVisible === 'delete' && 'Delete Account'}
                {modalVisible === 'admin' && 'Admin Controls'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {modalVisible === 'email' && (
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New email"
                  placeholderTextColor="#999"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Current password"
                  placeholderTextColor="#999"
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleUpdateEmail}
                />
                <TouchableOpacity
                  style={[styles.modalButton, loading && styles.disabledButton]}
                  onPress={handleUpdateEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Update Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {modalVisible === 'password' && (
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Current password"
                  placeholderTextColor="#999"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleUpdatePassword}
                />
                <TouchableOpacity
                  style={[styles.modalButton, loading && styles.disabledButton]}
                  onPress={handleUpdatePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {modalVisible === 'delete' && (
              <View style={styles.modalBody}>
                <Text style={styles.warningText}>
                  This action cannot be undone. All your data will be permanently deleted.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your password to confirm"
                  placeholderTextColor="#999"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleDeleteAccount}
                />
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton, loading && styles.disabledButton]}
                  onPress={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {modalVisible === 'admin' && (
              <View style={styles.modalBody}>
                <View style={styles.adminToggleRow}>
                  <Text style={styles.adminToggleLabel}>Disable Scheduling</Text>
                  <TouchableOpacity
                    style={[styles.adminToggle, schedulingDisabled && styles.adminToggleActive]}
                    onPress={() => setSchedulingDisabled(!schedulingDisabled)}
                  >
                    <Text style={[styles.adminToggleText, schedulingDisabled && styles.adminToggleTextActive]}>
                      {schedulingDisabled ? 'Disabled' : 'Enabled'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.adminLabel}>Disabled Message</Text>
                <TextInput
                  style={[styles.modalInput, styles.adminMessageInput]}
                  placeholder="Message to show when scheduling is disabled"
                  placeholderTextColor="#999"
                  value={disabledMessage}
                  onChangeText={setDisabledMessage}
                  multiline
                  numberOfLines={4}
                  returnKeyType="done"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[styles.modalButton, loading && styles.disabledButton]}
                  onPress={handleUpdateAdminSettings}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Update Settings</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phone: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    backgroundColor: COLORS.primaryLight,
  },
  deleteIcon: {
    backgroundColor: '#ffebee',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  deleteText: {
    color: '#ff3b30',
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
    gap: 12,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  warningText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 8,
  },
  adminIcon: {
    backgroundColor: '#e3f2fd',
  },
  adminToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminToggleLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  adminToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  adminToggleActive: {
    backgroundColor: COLORS.primary,
  },
  adminToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  adminToggleTextActive: {
    color: '#fff',
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  adminMessageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
