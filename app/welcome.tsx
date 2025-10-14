import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Phone, MessageSquare, Clock, Shield, Zap, ArrowRight } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Phone size={48} color={COLORS.primary} strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.title}>Gotta Go</Text>
          <Text style={styles.tagline}>Your Emergency Escape Plan</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Need an excuse to leave?{'\n'}We&apos;ve got you covered.
          </Text>
          <Text style={styles.heroDescription}>
            Schedule a fake call or text to help you gracefully exit any awkward situation.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
              <Phone size={28} color="#1976D2" />
            </View>
            <Text style={styles.featureTitle}>Realistic Calls</Text>
            <Text style={styles.featureDescription}>
              Choose from pre-recorded messages that sound authentic and convincing.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#F3E5F5' }]}>
              <MessageSquare size={28} color="#7B1FA2" />
            </View>
            <Text style={styles.featureTitle}>Custom Texts</Text>
            <Text style={styles.featureDescription}>
              Send yourself a text with any excuse you need at the perfect moment.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
              <Clock size={28} color="#F57C00" />
            </View>
            <Text style={styles.featureTitle}>Perfect Timing</Text>
            <Text style={styles.featureDescription}>
              Schedule your escape for exactly when you need it with quick presets.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
              <Shield size={28} color="#388E3C" />
            </View>
            <Text style={styles.featureTitle}>Stealth Mode</Text>
            <Text style={styles.featureDescription}>
              Hide the app from recent apps after scheduling for extra discretion.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
              <Zap size={28} color="#C2185B" />
            </View>
            <Text style={styles.featureTitle}>Quick Escape</Text>
            <Text style={styles.featureDescription}>
              One-tap presets for 5, 15, or 30 minutes when you need to leave fast.
            </Text>
          </View>
        </View>

        <View style={styles.storySection}>
          <Text style={styles.storyTitle}>Our Story</Text>
          <Text style={styles.storyText}>
            Originally created as a fun gift for a friend back in 2021, Gotta Go unexpectedly became a handy escape plan for many! 
          </Text>
          <Text style={styles.storyText}>
            After a little break, we&apos;re excited to bring it back, fully recharged and ready to help you make a smooth exit from any awkward situation.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy matters. All data is stored securely.
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  storySection: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    marginBottom: 16,
  },
  storyText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  getStartedButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
