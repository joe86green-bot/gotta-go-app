import React, { useState, useEffect } from 'react';
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
import { Users, Settings, X, AlertTriangle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminScreen() {
  const { userProfile, getAllUsers, setMaintenanceModeAdmin, maintenanceMode } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    loadUsers();
    setMaintenanceEnabled(maintenanceMode.enabled);
    setMaintenanceMessage(maintenanceMode.message || 'Service temporarily unavailable for maintenance');
  }, [maintenanceMode]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async () => {
    Keyboard.dismiss();
    
    if (maintenanceEnabled && !maintenanceMessage.trim()) {
      Alert.alert('Error', 'Please enter a maintenance message');
      return;
    }

    setSavingMaintenance(true);
    try {
      await setMaintenanceModeAdmin(maintenanceEnabled, maintenanceMessage);
      Alert.alert('Success', 'Maintenance mode updated');
      setShowMaintenanceModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update maintenance mode');
    } finally {
      setSavingMaintenance(false);
    }
  };

  if (!userProfile?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <AlertTriangle size={48} color={COLORS.danger} />
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptyDescription}>You do not have admin privileges</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Registered Users</Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{users.length}</Text>
            <Text style={styles.statsLabel}>Total Members</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.usersList}>
              {users.map((user, index) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.email}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                    <Text style={styles.userDate}>
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {user.isAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
            <Text style={styles.refreshButtonText}>Refresh List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Maintenance Mode</Text>
          </View>

          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceStatus}>
              <Text style={styles.maintenanceLabel}>Status:</Text>
              <View
                style={[
                  styles.statusBadge,
                  maintenanceMode.enabled ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>
                  {maintenanceMode.enabled ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {maintenanceMode.enabled && maintenanceMode.message && (
              <View style={styles.maintenanceMessageContainer}>
                <Text style={styles.maintenanceLabel}>Message:</Text>
                <Text style={styles.maintenanceMessageText}>{maintenanceMode.message}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.maintenanceButton}
              onPress={() => setShowMaintenanceModal(true)}
            >
              <Text style={styles.maintenanceButtonText}>Configure Maintenance Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showMaintenanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMaintenanceModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Maintenance Mode</Text>
                <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Enable Maintenance Mode</Text>
                  <TouchableOpacity
                    style={[styles.switch, maintenanceEnabled && styles.switchActive]}
                    onPress={() => setMaintenanceEnabled(!maintenanceEnabled)}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        maintenanceEnabled && styles.switchThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {maintenanceEnabled && (
                  <>
                    <Text style={styles.inputLabel}>Maintenance Message</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Enter message to display to users..."
                      placeholderTextColor="#999"
                      value={maintenanceMessage}
                      onChangeText={setMaintenanceMessage}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      returnKeyType="done"
                    />
                    <Text style={styles.helperText}>
                      This message will be shown when users try to schedule calls or texts
                    </Text>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, savingMaintenance && styles.disabledButton]}
                  onPress={handleSaveMaintenance}
                  disabled={savingMaintenance}
                >
                  {savingMaintenance ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  statsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  adminBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600' as const,
  },
  refreshButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  maintenanceCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  maintenanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  maintenanceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: COLORS.danger,
  },
  statusInactive: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600' as const,
  },
  maintenanceMessageContainer: {
    marginBottom: 16,
  },
  maintenanceMessageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  maintenanceButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  maintenanceButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic' as const,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold' as const,
  },
});
