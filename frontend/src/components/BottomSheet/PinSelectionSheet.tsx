import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectionState, SavedRoute } from '../../types';
import { Feather } from '@expo/vector-icons';

interface PinSelectionSheetProps {
  selecting: SelectionState;
  isMoving: boolean;
  pickupName: string;
  dropoffName: string;
  getPinColor: () => string;
  handleConfirm: () => void;
  resetFlow: () => void;
  savedRoutes: SavedRoute[];
  onSelectSavedRoute: (route: SavedRoute) => void;
  isOffline: boolean;
}

export default function PinSelectionSheet({
  selecting,
  isMoving,
  pickupName,
  dropoffName,
  getPinColor,
  handleConfirm,
  resetFlow,
  savedRoutes,
  onSelectSavedRoute,
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
      
      {selecting === 'pickup' && (
        <View style={{marginTop: 24}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}><Feather name="star" size={16} color="#d97706" /><Text style={{fontSize: 14, fontWeight: '700', color: '#4b5563', marginLeft: 6}}>Saved Daily Routes</Text></View>
          {savedRoutes.length === 0 ? (
            <View style={{backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6'}}>
              <Text style={{color: '#9ca3af', fontSize: 13}}>You haven't saved any routes yet.</Text>
              <Text style={{color: '#9ca3af', fontSize: 13, marginTop: 4}}>Complete a booking to save one!</Text>
            </View>
          ) : (
            savedRoutes.map((route, idx) => (
              <TouchableOpacity key={idx} style={styles.savedRouteCard} onPress={() => onSelectSavedRoute(route)}>
                <View style={styles.savedRouteIcon}>
                  <Feather name="bookmark" size={16} color="#059669" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 15, fontWeight: '700', color: '#111827'}}>{route.name}</Text>
                  <Text style={{fontSize: 12, color: '#6b7280', marginTop: 2}} numberOfLines={1}>{route.pickupName} → {route.dropoffName}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>
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
  cancelText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  savedRouteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 8 },
  savedRouteIcon: { backgroundColor: '#ecfdf5', padding: 10, borderRadius: 20, marginRight: 12 }
});

