import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coordinate } from '../../types';

interface TopHeaderProps {
  liveLocation: Coordinate | null;
  centerOnUser: () => void;
}

export default function TopHeader({ liveLocation, centerOnUser }: TopHeaderProps) {
  return (
    <SafeAreaView style={styles.headerSafe} edges={['top']} pointerEvents="box-none">
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="settings" size={20} color="#2563eb" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appName}>CabFairs</Text>
              <View style={styles.fairBadge}><Text style={styles.fairBadgeText}>Fair</Text></View>
            </View>
            <View style={styles.subtitleRow}>
              <Feather name="navigation" size={10} color="#666" />
              <Text style={styles.appSubtitle}> Ride / Pin</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Metro Grid</Text>
          <Image source={{uri: 'https://i.pravatar.cc/100?img=33'}} style={styles.avatar} />
        </View>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapIconBtn} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={20} color={liveLocation ? "#2563eb" : "#555"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 100, 
    marginHorizontal: 16, 
    marginTop: 8, 
    padding: 8, 
    paddingRight: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 8 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { backgroundColor: '#e0e7ff', padding: 6, borderRadius: 12, marginRight: 10, marginLeft: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  appName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  fairBadge: { backgroundColor: '#34d399', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, marginLeft: 4 },
  fairBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  appSubtitle: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 4 },
  statusText: { fontSize: 10, color: '#10b981', fontWeight: '600', marginRight: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  mapControls: { position: 'absolute', right: 16, top: 90, alignItems: 'flex-end', gap: 12 },
  mapIconBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
});

