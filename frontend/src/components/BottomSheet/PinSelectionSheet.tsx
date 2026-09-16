import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectionState } from '../../types';

interface PinSelectionSheetProps {
  selecting: SelectionState;
  isMoving: boolean;
  pickupName: string;
  dropoffName: string;
  getPinColor: () => string;
  handleConfirm: () => void;
  resetFlow: () => void;
}

export default function PinSelectionSheet({
  selecting,
  isMoving,
  pickupName,
  dropoffName,
  getPinColor,
  handleConfirm,
  resetFlow
}: PinSelectionSheetProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.selectingCard}>
      <Text style={styles.headerText}>
        {isMoving ? 'Release map to pin' : (selecting === 'pickup' ? 'Set your pickup location' : 'Set your drop-off location')}
      </Text>
      
      <View style={styles.locationBox}>
        <View style={styles.timelineCol}>
          <View style={[styles.dotGreen, {backgroundColor: getPinColor()}]} />
          {selecting === 'pickup' && <View style={styles.timelineLine} />}
          {selecting === 'pickup' && <View style={styles.squareOrange} />}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.label}>
            {selecting === 'pickup' ? 'Pickup Spot' : 'Drop-off Destination'}
          </Text>
          <Text style={styles.value} numberOfLines={1}>
            {selecting === 'pickup' ? pickupName : dropoffName}
          </Text>
          {selecting === 'pickup' && (
            <View style={{marginTop: 16}}>
              <Text style={styles.label}>Drop-off Destination</Text>
              <Text style={styles.value}>Location Selected</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: getPinColor() }]} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>
          {selecting === 'pickup' ? 'Confirm Pickup' : 'Confirm Dropoff'}
        </Text>
      </TouchableOpacity>
      
      {selecting === 'dropoff' && (
        <TouchableOpacity onPress={resetFlow} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectingCard: { padding: 24 },
  headerText: { color: '#4b5563', fontWeight: '600', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  locationBox: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, marginBottom: 24 },
  timelineCol: { width: 24, alignItems: 'center', marginTop: 4 },
  dotGreen: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, height: 24, backgroundColor: '#e5e7eb', marginVertical: 4 },
  squareOrange: { width: 8, height: 8, backgroundColor: '#d97706', borderRadius: 2 },
  textCol: { flex: 1, marginLeft: 12 },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  confirmBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 }
});

