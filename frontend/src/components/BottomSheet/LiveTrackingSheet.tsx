import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LiveTrackingSheetProps {
  resetFlow: () => void;
}

export default function LiveTrackingSheet({ resetFlow }: LiveTrackingSheetProps) {
  return (
    <View style={styles.container}>
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
  endText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

