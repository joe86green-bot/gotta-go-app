import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Switch,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, MessageSquare, Play, Pause, Check, Calendar, Clock, Save, Info, List, X, Eye, EyeOff, Shuffle, Zap, User, Settings as SettingsIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { RECORDINGS } from '@/constants/recordings';
import { scheduleCall, scheduleText } from '@/services/clicksend';
import { useScheduledItems } from '@/providers/ScheduledItemsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

type TabType = 'call' | 'text';

export default function HomeScreen() {
  const { user, isGuest, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('call');
  const [selectedRecording, setSelectedRecording] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedPhoneNumber, setSavedPhoneNumber] = useState('');
  const [textMessage, setTextMessage] = useState('');
  const [randomExcuses] = useState([
    "Emergency at work, need to leave ASAP!",
    "My mom needs me to pick her up right now",
    "Something urgent came up at home",
    "I'm not feeling well, need to head out",
    "My car is being towed, have to go!",
    "Family emergency, sorry to cut this short",
    "My dog got out and I need to find him",
    "Babysitter cancelled, need to get home",
    "Water pipe burst at my place!",
    "Doctor called with urgent test results",
    "My flight got moved up, leaving now",
    "Roommate locked themselves out",
    "Power went out at home, need to check",
    "Got called into work for emergency",
    "My sister is stranded and needs a ride"
  ]);
  const [currentExcuseIndex, setCurrentExcuseIndex] = useState(0);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 5 * 60000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [enableRetries, setEnableRetries] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [enableRandomTiming, setEnableRandomTiming] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string } | null>(null);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { addScheduledItem } = useScheduledItems();

  // Load saved phone number on mount
  useEffect(() => {
    const loadSavedNumber = async () => {
      try {
        const saved = await AsyncStorage.getItem('saved_phone_number');
        if (saved) {
          setSavedPhoneNumber(saved);
          setPhoneNumber(saved);
        }
      } catch (error) {
        console.error('Error loading saved phone number:', error);
      }
    };
    loadSavedNumber();
  }, []);

  // Save phone number when it changes
  useEffect(() => {
    const savePhoneNumber = async () => {
      if (phoneNumber && phoneNumber !== savedPhoneNumber) {
        try {
          await AsyncStorage.setItem('saved_phone_number', phoneNumber);
          setSavedPhoneNumber(phoneNumber);
        } catch (error) {
          console.error('Error saving phone number:', error);
        }
      }
    };
    const timeoutId = setTimeout(savePhoneNumber, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [phoneNumber, savedPhoneNumber]);

  // Rotate random excuses when text tab is viewed
  useEffect(() => {
    if (activeTab === 'text') {
      const newIndex = Math.floor(Math.random() * randomExcuses.length);
      setCurrentExcuseIndex(newIndex);
      setTextMessage(randomExcuses[newIndex]);
    }
  }, [activeTab, randomExcuses]);

  useEffect(() => {
    const loadMaintenanceMode = async () => {
      try {
        const maintenanceDoc = await getDoc(doc(db, 'settings', 'maintenance'));
        if (maintenanceDoc.exists()) {
          setMaintenanceMode(maintenanceDoc.data() as { enabled: boolean; message: string });
        } else {
          setMaintenanceMode({ enabled: false, message: '' });
        }
      } catch (error) {
        console.error('Error loading maintenance mode:', error);
        setMaintenanceMode({ enabled: false, message: '' });
      } finally {
        setIsLoadingMaintenance(false);
      }
    };
    loadMaintenanceMode();
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.replace('/login');
    }
  }, [user, isGuest, authLoading]);

  const CALL_SENDER_NUMBER = '+1 (818) 643-6090';
  const TEXT_SENDER_NUMBER = '+1 (833) 962-4030';

  const playRecording = async (recording: typeof RECORDINGS[0]) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (playingId === recording.id) {
        setPlayingId(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recording.url },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setPlayingId(recording.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const setQuickEscapeTime = (minutes: number) => {
    const quickDate = new Date(Date.now() + minutes * 60000);
    setScheduledDate(quickDate);
  };

  const saveToContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable contacts permission in settings');
        return;
      }

      const contact = {
        contactType: Contacts.ContactTypes.Person,
        name: 'Mom',
        [Contacts.Fields.FirstName]: 'Mom',
        [Contacts.Fields.PhoneNumbers]: [{
          label: 'mobile',
          number: activeTab === 'call' ? '+18186436090' : '+18339624030',
        }],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success', 'Contact saved as "Mom"');
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleSchedule = async () => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login or create an account to use this feature',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (maintenanceMode?.enabled) {
      Alert.alert('Maintenance Mode', maintenanceMode.message);
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (activeTab === 'call' && selectedRecording === null) {
      Alert.alert('Error', 'Please select a recording');
      return;
    }

    if (activeTab === 'text' && !textMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (scheduledDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    // Apply random timing if enabled (for calls with retries)
    let finalScheduledDate = scheduledDate;
    if (activeTab === 'call' && enableRetries && enableRandomTiming) {
      const randomMinutes = Math.floor(Math.random() * 3) + 1; // 1-3 minutes
      finalScheduledDate = new Date(scheduledDate.getTime() + randomMinutes * 60000);
    }

    setIsScheduling(true);

    try {
      if (activeTab === 'call') {
        const recording = RECORDINGS.find(r => r.id === selectedRecording);
        if (recording) {
          // Add to scheduled items first to check limit
          addScheduledItem({
            type: 'call',
            phoneNumber,
            scheduledTime: finalScheduledDate,
            recordingId: recording.id,
            recordingTitle: recording.title,
            maxRetries: enableRetries ? maxRetries : 1,
            retryCount: 0,
          });
          
          await scheduleCall(phoneNumber, finalScheduledDate, recording.url);
        }
      } else {
        // Add to scheduled items first to check limit
        addScheduledItem({
          type: 'text',
          phoneNumber,
          scheduledTime: finalScheduledDate,
          message: textMessage,
        });
        
        await scheduleText(phoneNumber, finalScheduledDate, textMessage);
      }

      // Handle stealth mode
      if (stealthMode && Platform.OS !== 'web') {
        // Minimize app to background
        setTimeout(() => {
          AppState.currentState = 'background';
        }, 1000);
      }

      router.push('/schedule-success');
      
      // Reset form (but keep phone number)
      setTextMessage('');
      setSelectedRecording(null);
      setScheduledDate(new Date(Date.now() + 5 * 60000));
      setStealthMode(false);
      setEnableRetries(false);
      setEnableRandomTiming(false);
    } catch (error) {
      console.error('Error scheduling:', error);
      if (error instanceof Error && error.message.includes('Maximum of 3 scheduled items')) {
        Alert.alert('Limit Reached', 'You can only have 3 scheduled items at a time. Please wait for some to complete or delete existing ones.');
      } else {
        Alert.alert('Error', 'Failed to schedule. Please try again.');
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowInfoModal(true)}
            >
              <Info size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Gotta Go</Text>
              <Text style={styles.subtitle}>Your emergency escape plan</Text>
            </View>
            <View style={styles.headerRight}>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.push('/admin')}
                >
                  <SettingsIcon size={24} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/scheduled-items')}
              >
                <List size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  if (isGuest) {
                    router.push('/login');
                  } else {
                    router.push('/account');
                  }
                }}
              >
                <User size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'call' && styles.activeTab]}
            onPress={() => setActiveTab('call')}
          >
            <Phone size={20} color={activeTab === 'call' ? '#fff' : COLORS.text} />
            <Text style={[styles.tabText, activeTab === 'call' && styles.activeTabText]}>
              Call
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.activeTab]}
            onPress={() => setActiveTab('text')}
          >
            <MessageSquare size={20} color={activeTab === 'text' ? '#fff' : COLORS.text} />
            <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
              Text
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {activeTab === 'call' ? 'Call' : 'Text'} will come from:
            </Text>
            <Text style={styles.phoneDisplay}>
              {activeTab === 'call' ? CALL_SENDER_NUMBER : TEXT_SENDER_NUMBER}
            </Text>
            <TouchableOpacity style={styles.saveButton} onPress={saveToContacts}>
              <Save size={16} color={COLORS.primary} />
              <Text style={styles.saveButtonText}>Save as contact (e.g., &quot;Mom&quot;)</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'call' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select a recording</Text>
              <View style={styles.recordingsContainer}>
                <ScrollView style={styles.recordingsList} showsVerticalScrollIndicator={false}>
                  {RECORDINGS.map((recording) => (
                    <TouchableOpacity
                      key={recording.id}
                      style={[
                        styles.recordingItem,
                        selectedRecording === recording.id && styles.selectedRecording,
                      ]}
                      onPress={() => setSelectedRecording(recording.id)}
                    >
                      <View style={styles.recordingInfo}>
                        <Text style={styles.recordingTitle}>{recording.title}</Text>
                        <Text style={styles.recordingDescription}>{recording.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => playRecording(recording)}
                      >
                        {playingId === recording.id ? (
                          <Pause size={20} color={COLORS.primary} />
                        ) : (
                          <Play size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                      {selectedRecording === recording.id && (
                        <View style={styles.checkMark}>
                          <Check size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.messageHeader}>
                <Text style={styles.sectionTitle}>Message</Text>
                <TouchableOpacity
                  style={styles.shuffleButton}
                  onPress={() => {
                    const newIndex = Math.floor(Math.random() * randomExcuses.length);
                    setCurrentExcuseIndex(newIndex);
                    setTextMessage(randomExcuses[newIndex]);
                  }}
                >
                  <Shuffle size={16} color={COLORS.primary} />
                  <Text style={styles.shuffleButtonText}>Random Excuse</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.messageContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Enter your escape message..."
                  placeholderTextColor="#999"
                  value={textMessage}
                  onChangeText={setTextMessage}
                  maxLength={160}
                  multiline
                  numberOfLines={4}
                />
                <Text style={styles.charCount}>{textMessage.length}/160</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            {/* Quick Escape Buttons */}
            <View style={styles.quickEscapeContainer}>
              <Text style={styles.quickEscapeTitle}>Quick Escape</Text>
              <View style={styles.quickEscapeButtons}>
                <TouchableOpacity
                  style={styles.quickEscapeButton}
                  onPress={() => setQuickEscapeTime(5)}
                >
                  <Zap size={16} color={COLORS.primary} />
                  <Text style={styles.quickEscapeButtonText}>5 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickEscapeButton}
                  onPress={() => setQuickEscapeTime(15)}
                >
                  <Zap size={16} color={COLORS.primary} />
                  <Text style={styles.quickEscapeButtonText}>15 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickEscapeButton}
                  onPress={() => setQuickEscapeTime(30)}
                >
                  <Zap size={16} color={COLORS.primary} />
                  <Text style={styles.quickEscapeButtonText}>30 min</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.text} />
                <Text style={styles.dateTimeText}>{formatDate(scheduledDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={COLORS.text} />
                <Text style={styles.dateTimeText}>{formatTime(scheduledDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Advanced Options */}
          <View style={styles.advancedSection}>
            <Text style={styles.sectionTitle}>Advanced Options</Text>
            
            {/* Stealth Mode */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  {stealthMode ? (
                    <EyeOff size={20} color={COLORS.primary} />
                  ) : (
                    <Eye size={20} color={COLORS.textSecondary} />
                  )}
                  <Text style={styles.optionTitle}>Stealth Mode</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Hide app from recent apps after scheduling
                </Text>
              </View>
              <Switch
                value={stealthMode}
                onValueChange={setStealthMode}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={stealthMode ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            {activeTab === 'call' && (
              <>
                {/* Retry Options */}
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <View style={styles.optionHeader}>
                      <Phone size={20} color={enableRetries ? COLORS.primary : COLORS.textSecondary} />
                      <Text style={styles.optionTitle}>Retry Calls</Text>
                    </View>
                    <Text style={styles.optionDescription}>
                      Call up to 3 times until answered
                    </Text>
                  </View>
                  <Switch
                    value={enableRetries}
                    onValueChange={setEnableRetries}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                    thumbColor={enableRetries ? COLORS.primary : '#f4f3f4'}
                  />
                </View>
                
                {enableRetries && (
                  <>
                    <View style={styles.retryCountContainer}>
                      <Text style={styles.retryCountLabel}>Max retries:</Text>
                      <View style={styles.retryCountButtons}>
                        {[1, 2, 3].map((count) => (
                          <TouchableOpacity
                            key={count}
                            style={[
                              styles.retryCountButton,
                              maxRetries === count && styles.retryCountButtonActive,
                            ]}
                            onPress={() => setMaxRetries(count)}
                          >
                            <Text
                              style={[
                                styles.retryCountButtonText,
                                maxRetries === count && styles.retryCountButtonTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Random Timing */}
                    <View style={styles.optionRow}>
                      <View style={styles.optionInfo}>
                        <View style={styles.optionHeader}>
                          <Shuffle size={20} color={enableRandomTiming ? COLORS.primary : COLORS.textSecondary} />
                          <Text style={styles.optionTitle}>Random Timing</Text>
                        </View>
                        <Text style={styles.optionDescription}>
                          Add 1-3 minutes randomness to seem natural
                        </Text>
                      </View>
                      <Switch
                        value={enableRandomTiming}
                        onValueChange={setEnableRandomTiming}
                        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                        thumbColor={enableRandomTiming ? COLORS.primary : '#f4f3f4'}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.scheduleButton, isScheduling && styles.disabledButton]}
            onPress={handleSchedule}
            disabled={isScheduling}
          >
            {isScheduling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scheduleButtonText}>
                Schedule {activeTab === 'call' ? 'Call' : 'Text'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerClose}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <X size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (date) setScheduledDate(date);
                  }}
                  minimumDate={new Date()}
                  style={styles.datePicker}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}

        {showTimePicker && (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Time</Text>
                  <TouchableOpacity
                    style={styles.datePickerClose}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <X size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={scheduledDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowTimePicker(false);
                    }
                    if (date) setScheduledDate(date);
                  }}
                  style={styles.datePicker}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDone}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}

        <Modal
          visible={showInfoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Welcome to Gotta Go!</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInfoModal(false)}
                >
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalText}>
                  Originally created as a fun gift for a friend back in 2021, this app unexpectedly became a handy escape plan for many! While it took a little break, we&apos;re excited to bring it back, fully recharged and ready to help you make a smooth exit from any awkward situation.
                </Text>

                <Text style={styles.modalText}>
                  Thank you for using Gotta Go! Now, let&apos;s make your escape easy and seamless!
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 4,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  phoneDisplay: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
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
  recordingsList: {
    maxHeight: 300,
  },
  recordingsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedRecording: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  recordingInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordingTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  recordingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 8,
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
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTimeText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  scheduleButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  scheduleButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  retrySection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  retryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  retryDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  retryCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryCountLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  retryCountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  retryCountButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
  },
  retryCountButtonActive: {
    backgroundColor: COLORS.primary,
  },
  retryCountButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  retryCountButtonTextActive: {
    color: '#fff',
  },
  quickEscapeContainer: {
    marginBottom: 16,
  },
  quickEscapeTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quickEscapeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickEscapeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickEscapeButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageContainer: {
    gap: 8,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
  },
  shuffleButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  advancedSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 300,
    alignItems: 'center',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  datePickerClose: {
    padding: 4,
  },
  datePicker: {
    width: '100%',
  },
  datePickerDone: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});