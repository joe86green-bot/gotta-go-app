import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogIn, UserPlus, Eye } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function WelcomeScreen() {
  const { continueAsGuest } = useAuth();

  const handleGuestMode = async () => {
    try {
      await continueAsGuest();
      router.replace('/');
    } catch (error) {
      console.error('Guest mode error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>Gotta Go</Text>
          <Text style={styles.tagline}>Your emergency escape plan</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📞</Text>
            <Text style={styles.featureTitle}>Scheduled Calls</Text>
            <Text style={styles.featureDescription}>
              Get a call at the perfect time to escape any situation
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Emergency Texts</Text>
            <Text style={styles.featureDescription}>
              Receive convincing text messages when you need them
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Quick Escape</Text>
            <Text style={styles.featureDescription}>
              Set up your exit in seconds with preset timings
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
          >
            <UserPlus size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <LogIn size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
            <Eye size={16} color={COLORS.textSecondary} />
            <Text style={styles.guestButtonText}>View as Guest</Text>
          </TouchableOpacity>

          <Text style={styles.guestNote}>
            Guest mode lets you explore features, but you need an account to use them
          </Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    marginTop: 4,
  },
  guestButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  guestNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
