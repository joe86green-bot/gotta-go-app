import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Phone, MessageSquare, Calendar } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useScheduledItems } from '@/providers/ScheduledItemsProvider';

export default function ScheduledItemsScreen() {
  const { scheduledItems, removeScheduledItem, clearAllScheduledItems } = useScheduledItems();



  const handleDeleteItem = (id: string, type: string) => {
    Alert.alert(
      'Delete Scheduled Item',
      `Are you sure you want to delete this scheduled ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removeScheduledItem(id)
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (scheduledItems.length === 0) return;
    
    Alert.alert(
      'Clear All Items',
      'Are you sure you want to delete all scheduled items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllScheduledItems
        },
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'sent': return COLORS.success;
      case 'failed': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  const sortedItems = [...scheduledItems].sort((a, b) => 
    a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Items</Text>
        {scheduledItems.length > 0 && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Scheduled Items</Text>
            <Text style={styles.emptyDescription}>
              Your scheduled calls and texts will appear here
            </Text>
          </View>
        ) : (
          sortedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemType}>
                  {item.type === 'call' ? (
                    <Phone size={16} color={COLORS.primary} />
                  ) : (
                    <MessageSquare size={16} color={COLORS.primary} />
                  )}
                  <Text style={styles.itemTypeText}>
                    {item.type === 'call' ? 'Call' : 'Text'}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id, item.type)}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{item.phoneNumber}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Calendar size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailValue}>{formatDateTime(item.scheduledTime)}</Text>
                </View>

                {item.type === 'call' && item.recordingTitle && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Recording:</Text>
                    <Text style={styles.detailValue}>{item.recordingTitle}</Text>
                  </View>
                )}

                {item.type === 'text' && item.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.detailLabel}>Message:</Text>
                    <Text style={styles.messageText}>{item.message}</Text>
                  </View>
                )}

                {item.maxRetries && item.maxRetries > 1 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Retries:</Text>
                    <Text style={styles.detailValue}>
                      {item.retryCount || 0}/{item.maxRetries}
                    </Text>
                  </View>
                )}
              </View>


            </View>
          ))
        )}
      </ScrollView>




    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.danger,
    borderRadius: 6,
  },
  clearAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTypeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.textSecondary,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  messageContainer: {
    gap: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
    fontStyle: 'italic' as const,
  },
  deleteButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

});