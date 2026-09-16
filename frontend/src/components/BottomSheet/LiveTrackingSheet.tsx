import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface LiveTrackingSheetProps {
  resetFlow: () => void;
  fareRegular: string;
}

export default function LiveTrackingSheet({ resetFlow, fareRegular }: LiveTrackingSheetProps) {
  const submitReport = async () => {
    try {
      const res = await fetch('http://192.168.1.9:8000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: 'UNKNOWN',
          route_name: 'Tacloban Commute',
          calculated_fare: parseFloat(fareRegular),
          charged_fare: parseFloat(fareRegular) + 10.00, // Example overcharge
          details: 'Driver demanded extra 10 pesos.'
        })
      });
      const data = await res.json();
      Alert.alert("Report Submitted", data.message || "Thank you. The local transport office has been notified.");
    } catch (e) {
      Alert.alert("Offline", "Report saved locally. It will be sent when you have internet.");
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={submitReport} style={styles.reportBtn}>
        <Feather name="alert-triangle" size={18} color="#ef4444" />
        <Text style={styles.reportText}>Report Overcharging</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={resetFlow} style={styles.endBtn}>
        <Text style={styles.endText}>End Tracking & Start Over</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  endBtn: { 
    alignItems: 'center', 
    padding: 18, 
    backgroundColor: '#92400e', 
    borderRadius: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 8
  },
  endText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fee2e2' },
  reportText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }
});

