import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Settings, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export default function AdminScreen() {
  const { isAdmin, getAllUsers, getUserCount } = useAuth();
  const [users, setUsers] = useState<{ email: string; phone: string; createdAt: string }[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>({
    enabled: false,
    message: 'The app is currently under maintenance. Please check back later.',
  });
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const [allUsers, count] = await Promise.all([
        getAllUsers(),
        getUserCount(),
      ]);
      setUsers(allUsers);
      setUserCount(count);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [getAllUsers, getUserCount]);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'You do not have admin privileges');
      return;
    }
    loadUsers();
    loadMaintenanceMode();
  }, [isAdmin, loadUsers]);

  const loadMaintenanceMode = async () => {
    try {
      const maintenanceDoc = await getDoc(doc(db, 'settings', 'maintenance'));
      if (maintenanceDoc.exists()) {
        const data = maintenanceDoc.data() as MaintenanceMode;
        setMaintenanceMode(data);
      }
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    }
  };

  const saveMaintenanceMode = async () => {
    if (!maintenanceMode.message.trim()) {
      Alert.alert('Error', 'Please enter a maintenance message');
      return;
    }

    setIsSavingMaintenance(true);
    try {
      await setDoc(doc(db, 'settings', 'maintenance'), maintenanceMode);
      Alert.alert('Success', 'Maintenance mode settings saved');
    } catch (error) {
      console.error('Error saving maintenance mode:', error);
      Alert.alert('Error', 'Failed to save maintenance mode settings');
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.accessDenied}>
          <AlertCircle size={64} color={COLORS.textSecondary} />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You do not have admin privileges
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Registered Users</Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{userCount}</Text>
            <Text style={styles.statsLabel}>Total Members</Text>
          </View>

          {isLoadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.usersList}>
              {users.map((user, index) => (
                <View key={index} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                    <Text style={styles.userDate}>
                      Joined: {formatDate(user.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Maintenance Mode</Text>
          </View>

          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceToggle}>
              <View>
                <Text style={styles.maintenanceTitle}>Enable Maintenance Mode</Text>
                <Text style={styles.maintenanceDescription}>
                  Disable schedule buttons and show custom message
                </Text>
              </View>
              <Switch
                value={maintenanceMode.enabled}
                onValueChange={(value) =>
                  setMaintenanceMode({ ...maintenanceMode, enabled: value })
                }
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={maintenanceMode.enabled ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Maintenance Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Enter message to display during maintenance"
                placeholderTextColor="#999"
                value={maintenanceMode.message}
                onChangeText={(text) =>
                  setMaintenanceMode({ ...maintenanceMode, message: text })
                }
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSavingMaintenance && styles.disabledButton]}
              onPress={saveMaintenanceMode}
              disabled={isSavingMaintenance}
            >
              {isSavingMaintenance ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginTop: 16,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  statsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
  },
  statsLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    gap: 4,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  maintenanceCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  maintenanceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  maintenanceDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: '80%',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
