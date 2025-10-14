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

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Phone size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Gotta Go</Text>
          <Text style={styles.tagline}>Your Emergency Escape Plan</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Need an excuse to leave?{'\n'}We&apos;ve got you covered.
          </Text>
          <Text style={styles.heroDescription}>
            Schedule fake calls or texts to help you escape awkward situations gracefully.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Phone size={28} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Realistic Calls</Text>
              <Text style={styles.featureDescription}>
                Choose from pre-recorded emergency calls that sound authentic
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <MessageSquare size={28} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Convincing Texts</Text>
              <Text style={styles.featureDescription}>
                Get text messages with believable excuses at the perfect time
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Clock size={28} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Perfect Timing</Text>
              <Text style={styles.featureDescription}>
                Schedule your escape for exactly when you need it
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Shield size={28} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Discreet & Private</Text>
              <Text style={styles.featureDescription}>
                Your secret escape plan stays between you and us
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Zap size={28} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Quick Escape</Text>
              <Text style={styles.featureDescription}>
                Set up an emergency exit in just 5, 15, or 30 minutes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.useCasesSection}>
          <Text style={styles.sectionTitle}>Perfect For</Text>
          <View style={styles.useCasesList}>
            <Text style={styles.useCaseItem}>• Bad dates</Text>
            <Text style={styles.useCaseItem}>• Awkward meetings</Text>
            <Text style={styles.useCaseItem}>• Boring parties</Text>
            <Text style={styles.useCaseItem}>• Uncomfortable situations</Text>
            <Text style={styles.useCaseItem}>• When you just need an out</Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Originally created in 2021, now back and better than ever!
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  useCasesSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  useCasesList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useCaseItem: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 28,
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
