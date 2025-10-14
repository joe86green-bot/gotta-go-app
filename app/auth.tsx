import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, signIn, continueAsGuest } = useAuth();

  const handleSubmit = async () => {
    console.log('🟢 [AUTH_SCREEN] handleSubmit called');
    console.log('🟢 [AUTH_SCREEN] Mode:', mode);
    console.log('🟢 [AUTH_SCREEN] Email:', email);
    console.log('🟢 [AUTH_SCREEN] Phone:', phone);
    console.log('🟢 [AUTH_SCREEN] Password length:', password.length);
    
    Keyboard.dismiss();
    
    if (!email || !password) {
      console.log('❌ [AUTH_SCREEN] Missing email or password');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'register') {
      console.log('🟢 [AUTH_SCREEN] Register mode validation...');
      if (!phone) {
        console.log('❌ [AUTH_SCREEN] Missing phone number');
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }
      if (password !== confirmPassword) {
        console.log('❌ [AUTH_SCREEN] Passwords do not match');
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        console.log('❌ [AUTH_SCREEN] Password too short');
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      console.log('✅ [AUTH_SCREEN] All validations passed');
    }

    console.log('🟢 [AUTH_SCREEN] Setting loading to true');
    setLoading(true);
    try {
      if (mode === 'register') {
        console.log('🟢 [AUTH_SCREEN] Calling register function...');
        const user = await register(email, password, phone);
        console.log('✅ [AUTH_SCREEN] Register function completed, user:', user.uid);
      } else {
        console.log('🟢 [AUTH_SCREEN] Calling signIn function...');
        const user = await signIn(email, password);
        console.log('✅ [AUTH_SCREEN] SignIn function completed, user:', user.uid);
      }
      
      console.log('🟢 [AUTH_SCREEN] Auth successful, navigating immediately...');
      router.replace('/');
      console.log('✅ [AUTH_SCREEN] Navigation completed');
    } catch (error: any) {
      console.error('❌ [AUTH_SCREEN] Error in handleSubmit:', error);
      console.error('❌ [AUTH_SCREEN] Error message:', error.message);
      Alert.alert('Error', error.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    try {
      await continueAsGuest();
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to continue as guest');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Gotta Go</Text>
              <Text style={styles.subtitle}>Your emergency escape plan</Text>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.activeTab]}
                onPress={() => setMode('login')}
              >
                <LogIn size={20} color={mode === 'login' ? '#fff' : COLORS.text} />
                <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'register' && styles.activeTab]}
                onPress={() => setMode('register')}
              >
                <UserPlus size={20} color={mode === 'register' ? '#fff' : COLORS.text} />
                <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#999"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={mode === 'register' ? 'next' : 'done'}
                    onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={COLORS.textSecondary} />
                    ) : (
                      <Eye size={20} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={COLORS.textSecondary} />
                      ) : (
                        <Eye size={20} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'login' ? 'Login' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  activeTabText: {
    color: '#fff',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeButton: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
});
