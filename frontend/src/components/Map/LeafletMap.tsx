import React, { forwardRef } from 'react';
import { View, Animated, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { getLeafletHtml } from '../../constants/MapHtml';
import { SelectionState } from '../../types';

interface LeafletMapProps {
  selecting: SelectionState;
  isMoving: boolean;
  pinBounce: Animated.Value;
  getPinColor: () => string;
  onMessage: (event: any) => void;
  onMapLayout: () => void;
}

const LeafletMap = forwardRef<WebView, LeafletMapProps>(({
  selecting,
  isMoving,
  pinBounce,
  getPinColor,
  onMessage,
  onMapLayout
}, ref) => {
  return (
    <View style={styles.mapWrapper} onLayout={onMapLayout}>
      <WebView 
        ref={ref} 
        source={{ html: getLeafletHtml() }} 
        style={{ flex: 1 }} 
        onMessage={onMessage} 
        scrollEnabled={false} 
        bounces={false} 
      />
      
      {selecting !== 'done' && (
        <View style={styles.centerPinContainer} pointerEvents="none">
          <Animated.View style={[styles.tooltipBadge, { transform: [{ translateY: pinBounce }] }]}>
            <Text style={styles.tooltipText}>
              {isMoving ? 'Moving...' : (selecting === 'pickup' ? 'Set Pickup' : 'Set Drop-off')}
            </Text>
          </Animated.View>
          <Animated.View style={[styles.centerPin, { backgroundColor: getPinColor(), transform: [{ translateY: pinBounce }] }]}>
            <View style={styles.centerPinDot} />
          </Animated.View>
          <View style={styles.centerPinStick} />
          <View style={styles.centerPinShadow} />
        </View>
      )}
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  mapWrapper: { flex: 1, position: 'relative' },
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -50, marginTop: -70, alignItems: 'center', justifyContent: 'flex-end', width: 100, height: 70, zIndex: 10 },
  tooltipBadge: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 4 },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  centerPin: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, zIndex: 2 },
  centerPinDot: { width: 8, height: 8, backgroundColor: '#fff', borderRadius: 4 },
  centerPinStick: { width: 3, height: 14, backgroundColor: '#374151', marginTop: -2, zIndex: 1 },
  centerPinShadow: { width: 12, height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6, marginTop: -2 }
});

