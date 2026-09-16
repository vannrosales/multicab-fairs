import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

interface BookingSheetProps {
  pickupName: string;
  dropoffName: string;
  routeDistance: number | null;
  fareRegular: string;
  fareDiscount: string;
  startRide: () => void;
  resetFlow: () => void;
  onSaveRoute: () => void;
  isOffline: boolean;
}

export default function BookingSheet({
  pickupName,
  dropoffName,
  routeDistance,
  fareRegular,
  fareDiscount,
  startRide,
  resetFlow,
  onSaveRoute,
}: BookingSheetProps) {
  return (
    <View style={styles.doneSheetWrapper}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
        
        
        <View style={styles.locationCard}>
          <View style={styles.locLeft}>
            <View style={styles.dotGreen} />
            <View style={styles.locLine} />
            <View style={styles.squareOrange} />
          </View>
          <View style={styles.locMiddle}>
            <View style={styles.locInputBox}>
              <Text style={styles.locLabel}>Pickup Spot</Text>
              <Text style={styles.locValue} numberOfLines={1}>{pickupName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.locInputBox}>
              <Text style={styles.locLabel}>Drop-off Destination</Text>
              <Text style={styles.locValue} numberOfLines={1}>{dropoffName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bannerRow}>
          <View style={styles.bannerLeft}>
            <MaterialIcons name="verified-user" size={16} color="#059669" />
            <View style={{marginLeft: 6}}>
              <Text style={styles.bannerTitle}>Regulated Rates</Text>
              <Text style={styles.bannerSub}>Zero surge guarantee</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.routeOptsBtn} onPress={onSaveRoute}>
            <Feather name="star" size={12} color="#d97706" />
            <Text style={styles.routeOptsText}>Save Daily Route</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.multicabCard}>
          <FontAwesome5 name="shuttle-van" size={24} color="#d97706" />
          <View style={styles.multicabInfo}>
            <Text style={styles.multicabTitle}>Standard Multicab</Text>
            <Text style={styles.multicabSub}>Typically arrives in 3-5 mins</Text>
          </View>
          <Text style={styles.multicabPrice}>₱{fareRegular}</Text>
        </View>

        <View style={styles.priceBreakdown}>
          <View style={{flex: 1}}>
            <View style={styles.priceHeaderRow}>
              <View style={styles.dotGreenSm} />
              <Text style={styles.priceLabel}>Estimated Fair Range</Text>
            </View>
            <Text style={styles.priceSub}>Ordinance No. 2022-15-03 • {routeDistance} km</Text>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={styles.priceBig}>₱{fareDiscount} - ₱{fareRegular}</Text>
            <View style={styles.priceSaveRow}>
              <Feather name="thumbs-up" size={12} color="#059669" />
              <Text style={styles.priceSave}>₱{fareDiscount} for PWD/Student</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={startRide}>
          <MaterialCommunityIcons name="car-sports" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Calculate Fair and Start Ride</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={resetFlow} style={styles.startOverBtn}>
          <Text style={styles.startOverText}>Start Over</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  doneSheetWrapper: { maxHeight: '100%' }, // Allows scroll view to size correctly
  sheetScroll: { padding: 24, paddingBottom: 32 },
  
  locationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  locLeft: { width: 24, alignItems: 'center', marginTop: 4 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669' },
  locLine: { width: 2, height: 30, backgroundColor: '#e5e7eb', marginVertical: 4 },
  squareOrange: { width: 8, height: 8, backgroundColor: '#d97706', borderRadius: 2 },
  locMiddle: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  locInputBox: { justifyContent: 'center' },
  locLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  locValue: { fontSize: 15, fontWeight: '700', color: '#111827', flexShrink: 1, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },

  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12, marginTop: 16 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '700', color: '#059669' },
  bannerSub: { fontSize: 11, color: '#4b5563' },
  routeOptsBtn: { flexDirection: 'row', alignItems: 'center' },
  routeOptsText: { fontSize: 11, fontWeight: 'bold', color: '#d97706', marginLeft: 4 },

  multicabCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#fef3c7' },
  multicabInfo: { marginLeft: 16, flex: 1 },
  multicabTitle: { fontSize: 15, fontWeight: '800', color: '#92400e' },
  multicabSub: { fontSize: 12, color: '#b45309', marginTop: 2 },
  multicabPrice: { fontSize: 18, fontWeight: '800', color: '#d97706' },

  priceBreakdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 24 },
  priceHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreenSm: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  priceLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8 },
  priceSub: { fontSize: 11, color: '#6b7280', marginTop: 4, marginLeft: 14 },
  priceBig: { fontSize: 18, fontWeight: '800', color: '#111827' },
  priceSaveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  priceSave: { fontSize: 11, fontWeight: '600', color: '#059669', marginLeft: 4 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#92400e', paddingVertical: 18, borderRadius: 14, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginHorizontal: 12 },
  
  startOverBtn: { marginTop: 24, alignItems: 'center' },
  startOverText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 }
});

