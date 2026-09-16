import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import OnboardingScreen from './OnboardingScreen';
import { Coordinate, SelectionState } from './src/types';
import TopHeader from './src/components/Header/TopHeader';
import BottomTabBar from './src/components/Navigation/BottomTabBar';
import PinSelectionSheet from './src/components/BottomSheet/PinSelectionSheet';
import BookingSheet from './src/components/BottomSheet/BookingSheet';
import LiveTrackingSheet from './src/components/BottomSheet/LiveTrackingSheet';
import LeafletMap from './src/components/Map/LeafletMap';

export default function App() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then(val => {
      setIsFirstTime(val !== 'true');
    });
  }, []);

  if (isFirstTime === null) return null;

  if (isFirstTime) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={() => {
          AsyncStorage.setItem('hasSeenOnboarding', 'true');
          setIsFirstTime(false);
        }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

function MainScreen() {
  const [activeTab, setActiveTab] = useState('Ride / Pin');
  const webViewRef = useRef<WebView>(null);
  
  const [pickup, setPickup] = useState<Coordinate | null>(null);
  const [dropoff, setDropoff] = useState<Coordinate | null>(null);
  const [selecting, setSelecting] = useState<SelectionState>('pickup');
  const [centerCoord, setCenterCoord] = useState<Coordinate | null>(null);
  
  const [pickupName, setPickupName] = useState("Move map to set pin");
  const [dropoffName, setDropoffName] = useState("Where to?");
  const [isMoving, setIsMoving] = useState(false);
  const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
  
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [fareRegular, setFareRegular] = useState("0.00");
  const [fareDiscount, setFareDiscount] = useState("0.00");
  const [isRiding, setIsRiding] = useState(false);
  
  const pinBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        (location) => {
          const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          setLiveLocation(coords);
          webViewRef.current?.postMessage(JSON.stringify({ type: 'liveLocation', lat: coords.latitude, lng: coords.longitude }));
        }
      );
    })();
    return () => { if (sub) sub.remove(); };
  }, []);

  const reverseGeocode = async (lat: number, lng: number, type: 'pickup'|'dropoff') => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'MulticabFairsApp/1.0' }
      });
      const data = await res.json();
      let name = data.name || (data.display_name ? data.display_name.split(',')[0] : null) || "Pinned Location";
      if (type === 'pickup') setPickupName(name);
      else setDropoffName(name);
    } catch (e) {
      if (type === 'pickup') setPickupName("Location Selected");
      else setDropoffName("Location Selected");
    }
  };

  const calculateFareAPI = async (distKm: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/fare/calculate?distance_km=${distKm}`);
      const data = await res.json();
      setFareRegular(parseFloat(data.regular_fare).toFixed(2));
      setFareDiscount(parseFloat(data.discounted_fare).toFixed(2));
    } catch (e) {
      let reg = 12.00 + Math.max(0, Math.ceil(distKm - 2)) * 2.00;
      let disc = reg * 0.8;
      setFareRegular(reg.toFixed(2));
      setFareDiscount(disc.toFixed(2));
    }
  };

  const onMapLayout = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'resize' }));
  };

  const onMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'routeInfo') {
      const dist = parseFloat(data.distanceKm);
      setRouteDistance(dist);
      calculateFareAPI(dist);
      return;
    }
    if (data.type === 'resize') {
      return;
    }
    if (data.type === 'center') {
      setIsMoving(false);
      Animated.spring(pinBounce, { toValue: 0, useNativeDriver: true }).start();
      setCenterCoord({ latitude: data.lat, longitude: data.lng });
      
      if (selecting === 'pickup') {
        reverseGeocode(data.lat, data.lng, 'pickup');
      } else if (selecting === 'dropoff') {
        reverseGeocode(data.lat, data.lng, 'dropoff');
      }
    } else if (data.type === 'dragstart') {
      setIsMoving(true);
      Animated.spring(pinBounce, { toValue: -15, useNativeDriver: true }).start();
      if (selecting === 'pickup') setPickupName("Searching...");
      else if (selecting === 'dropoff') setDropoffName("Searching...");
    }
  };

  const handleConfirm = () => {
    if (!centerCoord) return;
    if (selecting === 'pickup') {
      setPickup(centerCoord);
      setSelecting('dropoff');
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setPickup', lat: centerCoord.latitude, lng: centerCoord.longitude }));
    } else if (selecting === 'dropoff') {
      setDropoff(centerCoord);
      setSelecting('done');
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setDropoff', lat: centerCoord.latitude, lng: centerCoord.longitude }));
    }
  };

  const resetFlow = () => {
    setPickup(null);
    setDropoff(null);
    setPickupName("Move map to set pin");
    setDropoffName("Where to?");
    setSelecting('pickup');
    setIsRiding(false);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'reset' }));
  };

  const centerOnUser = () => {
    if (liveLocation) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'centerTo', lat: liveLocation.latitude, lng: liveLocation.longitude }));
    } else {
      Alert.alert("Locating", "Still searching for GPS signal...");
    }
  };

  const startRide = () => {
    setIsRiding(true);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'startRiding' }));
  };

  const getPinColor = () => selecting === 'pickup' ? '#059669' : '#d97706';

  return (
    <View style={styles.container}>
      <LeafletMap 
        ref={webViewRef}
        selecting={selecting}
        isMoving={isMoving}
        pinBounce={pinBounce}
        getPinColor={getPinColor}
        onMessage={onMessage}
        onMapLayout={onMapLayout}
      />

      <TopHeader 
        liveLocation={liveLocation}
        centerOnUser={centerOnUser}
      />

      <View style={styles.bottomAreaContainer}>
        {isRiding ? (
          <LiveTrackingSheet resetFlow={resetFlow} />
        ) : selecting !== 'done' ? (
          <PinSelectionSheet 
            selecting={selecting}
            isMoving={isMoving}
            pickupName={pickupName}
            dropoffName={dropoffName}
            getPinColor={getPinColor}
            handleConfirm={handleConfirm}
            resetFlow={resetFlow}
          />
        ) : (
          <BookingSheet 
            pickupName={pickupName}
            dropoffName={dropoffName}
            routeDistance={routeDistance}
            fareRegular={fareRegular}
            fareDiscount={fareDiscount}
            startRide={startRide}
            resetFlow={resetFlow}
          />
        )}

        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  bottomAreaContainer: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 16, 
    elevation: 20 
  }
});
