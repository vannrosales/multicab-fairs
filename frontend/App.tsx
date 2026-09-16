import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Feather, MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import OnboardingScreen from './OnboardingScreen';

const { height } = Dimensions.get('window');

type Coordinate = { latitude: number; longitude: number; };

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
  const [selecting, setSelecting] = useState<'pickup' | 'dropoff' | 'done'>('pickup');
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background-color: #f8f9fa; }
        html, body, #map { height: 100%; width: 100%; }
        .leaflet-control-attribution { display: none !important; }
        .marker-pickup { background-color: #059669; border-radius: 50%; border: 3px solid white; width: 14px; height: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .marker-dropoff { background-color: #d97706; border-radius: 2px; border: 3px solid white; width: 14px; height: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .live-dot { background-color: #3b82f6; border-radius: 50%; border: 2px solid white; width: 16px; height: 16px; box-shadow: 0 0 10px rgba(59,130,246,0.8); }
        .route-badge { background: #1f2937; color: white; padding: 4px 10px; border-radius: 12px; font-family: sans-serif; font-size: 11px; font-weight: bold; text-align: center; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .surge-text { color: #34d399; margin-left: 4px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, minZoom: 12, maxBounds: [[11.1000, 124.9500], [11.3000, 125.0500]], maxBoundsViscosity: 1.0 }).setView([11.2016, 124.9979], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        var pickupIcon = L.divIcon({className: 'marker-pickup', iconSize: [14, 14], iconAnchor: [7, 7]});
        var dropoffIcon = L.divIcon({className: 'marker-dropoff', iconSize: [14, 14], iconAnchor: [7, 7]});
        var liveIcon = L.divIcon({className: 'live-dot', iconSize: [16, 16], iconAnchor: [8, 8]});

        var pickupMarker = null;
        var dropoffMarker = null;
        var liveMarker = null;
        var routeLine = null;
        var badgeMarker = null;

        setTimeout(() => {
          var initial = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: initial.lat, lng: initial.lng }));
        }, 500);

        map.on('movestart', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dragstart' }));
        });

        map.on('moveend', function() {
          var center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: center.lat, lng: center.lng }));
        });

        document.addEventListener('message', function(event) { handleMessage(JSON.parse(event.data)); });
        window.addEventListener('message', function(event) { handleMessage(JSON.parse(event.data)); });

        function handleMessage(data) {
          if (data.type === 'resize') {
            map.invalidateSize();
            if (routeLine) { map.fitBounds(routeLine.getBounds(), { padding: [50, 50] }); }
            return;
          }
          if (data.type === 'liveLocation') {
            if (liveMarker) { liveMarker.setLatLng([data.lat, data.lng]); } 
            else { liveMarker = L.marker([data.lat, data.lng], {icon: liveIcon}).addTo(map); }
            if (window.isTrackingLive) {
              map.panTo([data.lat, data.lng]);
            }
          }
          else if (data.type === 'setPickup') {
            if (pickupMarker) map.removeLayer(pickupMarker);
            pickupMarker = L.marker([data.lat, data.lng], {icon: pickupIcon}).addTo(map);
          }
          else if (data.type === 'setDropoff') {
            if (dropoffMarker) map.removeLayer(dropoffMarker);
            dropoffMarker = L.marker([data.lat, data.lng], {icon: dropoffIcon}).addTo(map);
            
            if (pickupMarker && dropoffMarker) {
              if (routeLine) map.removeLayer(routeLine);
              if (badgeMarker) map.removeLayer(badgeMarker);
              
              var pLatLng = pickupMarker.getLatLng();
              var dLatLng = dropoffMarker.getLatLng();
              
              fetch('https://router.project-osrm.org/route/v1/driving/' + pLatLng.lng + ',' + pLatLng.lat + ';' + dLatLng.lng + ',' + dLatLng.lat + '?overview=full&geometries=geojson')
                .then(res => res.json())
                .then(routeData => {
                  if (routeData.routes && routeData.routes[0]) {
                    var route = routeData.routes[0];
                    var coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
                    
                    routeLine = L.polyline(coordinates, { color: '#8B4513', weight: 4, dashArray: '8, 8' }).addTo(map);
                    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                    
                    var distanceKm = (route.distance / 1000).toFixed(2);
                    var durationMin = Math.round(route.duration / 60) || 1;
                    
                    var midIndex = Math.floor(coordinates.length / 2);
                    var midLat = coordinates[midIndex][0];
                    var midLng = coordinates[midIndex][1];
                    
                    var badgeIcon = L.divIcon({
                      className: 'custom-badge',
                      html: '<div class="route-badge">' + durationMin + ' min • ' + distanceKm + ' km <span class="surge-text">No Surge</span></div>',
                      iconSize: [150, 30],
                      iconAnchor: [75, 15]
                    });
                    badgeMarker = L.marker([midLat, midLng], {icon: badgeIcon}).addTo(map);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'routeInfo', distanceKm: distanceKm }));
                  }
                }).catch(err => {
                  // Fallback to straight line if API fails
                  routeLine = L.polyline([pLatLng, dLatLng], { color: '#8B4513', weight: 4, dashArray: '8, 8' }).addTo(map);
                  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                  var distanceKm = (pLatLng.distanceTo(dLatLng) / 1000).toFixed(2);
                  var midLat = (pLatLng.lat + dLatLng.lat) / 2;
                  var midLng = (pLatLng.lng + dLatLng.lng) / 2;
                  var badgeIcon = L.divIcon({
                    className: 'custom-badge',
                    html: '<div class="route-badge">' + Math.round(distanceKm * 3) + ' min • ' + distanceKm + ' km <span class="surge-text">No Surge</span></div>',
                    iconSize: [150, 30],
                    iconAnchor: [75, 15]
                  });
                  badgeMarker = L.marker([midLat, midLng], {icon: badgeIcon}).addTo(map);
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'routeInfo', distanceKm: distanceKm }));
                });
            }
          }
          else if (data.type === 'reset') {
            if (pickupMarker) map.removeLayer(pickupMarker);
            if (dropoffMarker) map.removeLayer(dropoffMarker);
            if (routeLine) map.removeLayer(routeLine);
            if (badgeMarker) map.removeLayer(badgeMarker);
            pickupMarker = null; dropoffMarker = null; routeLine = null; badgeMarker = null; window.isTrackingLive = false;
          }
          else if (data.type === 'centerTo') {
            map.flyTo([data.lat, data.lng], 16);
          }
          else if (data.type === 'startRiding') {
            window.isTrackingLive = true;
            if (liveMarker) {
              map.flyTo(liveMarker.getLatLng(), 18, {animate: true, duration: 1.5});
            }
          }
        }
      </script>
    </body>
    </html>
  `;

  const calculateFareAPI = async (distKm: number) => {
    try {
      // NOTE: Connecting to the Laravel backend the subagent is building!
      // In a real device this might need to be your computer's IP address.
      const res = await fetch(`http://127.0.0.1:8000/api/fare/calculate?distance_km=${distKm}`);
      const data = await res.json();
      setFareRegular(parseFloat(data.regular_fare).toFixed(2));
      setFareDiscount(parseFloat(data.discounted_fare).toFixed(2));
    } catch (e) {
      // Fallback local calculation if backend is not running yet
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
    } else if (data.type === 'resize') {
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

  const getPinColor = () => selecting === 'pickup' ? '#059669' : '#d97706';

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper} onLayout={onMapLayout}>
        <WebView 
          ref={webViewRef} 
          source={{ html: htmlContent }} 
          style={{ flex: 1 }} 
          onMessage={onMessage} 
          scrollEnabled={false} 
          bounces={false} 
        />
        
        {selecting !== 'done' && (
          <View style={styles.centerPinContainer} pointerEvents="none">
            {/* The selecting label brought back on screen! */}
            <Animated.View style={{backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 4, transform: [{ translateY: pinBounce }]}}>
              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>
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
      </View>

      <View style={styles.bottomAreaContainer}>
        {selecting !== 'done' ? (
          <SafeAreaView edges={['bottom']} style={styles.selectingCard}>
            <Text style={{color: '#4b5563', fontWeight: '600', fontSize: 15, marginBottom: 16, textAlign: 'center'}}>
              {isMoving ? 'Release map to pin' : (selecting === 'pickup' ? 'Set your pickup location' : 'Set your drop-off location')}
            </Text>
            
            <View style={{flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, marginBottom: 20}}>
              <View style={{width: 24, alignItems: 'center', marginTop: 4}}>
                <View style={[styles.dotGreen, {backgroundColor: getPinColor()}]} />
                {selecting === 'pickup' && <View style={{width: 2, height: 24, backgroundColor: '#e5e7eb', marginVertical: 4}} />}
                {selecting === 'pickup' && <View style={{width: 8, height: 8, backgroundColor: '#d97706', borderRadius: 2}} />}
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={{fontSize: 11, color: '#9ca3af', fontWeight: '600'}}>
                  {selecting === 'pickup' ? 'Pickup Spot' : 'Drop-off Destination'}
                </Text>
                <Text style={{fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2}} numberOfLines={1}>
                  {selecting === 'pickup' ? pickupName : dropoffName}
                </Text>
                {selecting === 'pickup' && (
                  <View style={{marginTop: 16}}>
                    <Text style={{fontSize: 11, color: '#9ca3af', fontWeight: '600'}}>Drop-off Destination</Text>
                    <Text style={{fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2}}>Location Selected</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: getPinColor() }]} onPress={handleConfirm}>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>
                {selecting === 'pickup' ? 'Confirm Pickup' : 'Confirm Dropoff'}
              </Text>
            </TouchableOpacity>
            {selecting === 'dropoff' && (
              <TouchableOpacity onPress={resetFlow} style={{marginTop: 16, alignItems: 'center'}}>
                <Text style={{color: '#666', fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        ) : (
          <View style={styles.doneSheetWrapper}>
            
            {isRiding ? (
              <View style={{padding: 24}}>
                <TouchableOpacity onPress={resetFlow} style={{alignItems: 'center', padding: 18, backgroundColor: '#92400e', borderRadius: 16}}>
                  <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>End Tracking & Start Over</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
                    <View style={styles.locValueRow}>
                      <Text style={styles.locValue} numberOfLines={1}>{pickupName}</Text>
                    </View>
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
                <TouchableOpacity style={styles.routeOptsBtn}>
                  <Feather name="sliders" size={12} color="#d97706" />
                  <Text style={styles.routeOptsText}>Route Opts</Text>
                </TouchableOpacity>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#fef3c7'}}>
                <FontAwesome5 name="shuttle-van" size={24} color="#d97706" />
                <View style={{marginLeft: 16, flex: 1}}>
                  <Text style={{fontSize: 15, fontWeight: '800', color: '#92400e'}}>Standard Multicab</Text>
                  <Text style={{fontSize: 12, color: '#b45309', marginTop: 2}}>Typically arrives in 3-5 mins</Text>
                </View>
                <Text style={{fontSize: 18, fontWeight: '800', color: '#d97706'}}>₱{fareRegular}</Text>
              </View>

              <View style={styles.priceBreakdown}>
                <View style={{flex: 1}}>
                  <View style={styles.priceHeaderRow}>
                    <View style={styles.dotGreen} />
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

              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsRiding(true); webViewRef.current?.postMessage(JSON.stringify({ type: 'startRiding' })); }}>
                <MaterialCommunityIcons name="car-sports" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Calculate Fair and Start Ride</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={resetFlow} style={{marginTop: 24, alignItems: 'center'}}>
                <Text style={{color: '#6b7280', fontWeight: 'bold', fontSize: 16}}>Start Over</Text>
              </TouchableOpacity>
            </ScrollView>
            )}
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Ride / Pin')}>
            <Feather name="navigation" size={20} color={activeTab === 'Ride / Pin' ? '#000' : '#888'} />
            <Text style={[styles.navText, activeTab === 'Ride / Pin' && styles.navTextActive]}>Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Fair Calc')}>
            <MaterialCommunityIcons name="calculator" size={20} color={activeTab === 'Fair Calc' ? '#000' : '#888'} />
            <Text style={[styles.navText, activeTab === 'Fair Calc' && styles.navTextActive]}>Fair Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Activity')}>
            <Feather name="file-text" size={20} color={activeTab === 'Activity' ? '#000' : '#888'} />
            <Text style={[styles.navText, activeTab === 'Activity' && styles.navTextActive]}>Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
            <Feather name="user" size={20} color={activeTab === 'Profile' ? '#000' : '#888'} />
            <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  mapWrapper: { flex: 1, position: 'relative' },
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 100, marginHorizontal: 16, marginTop: 8, padding: 8, paddingRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
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
  
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -50, marginTop: -70, alignItems: 'center', justifyContent: 'flex-end', width: 100, height: 70, zIndex: 10 },
  centerPin: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, zIndex: 2 },
  centerPinDot: { width: 8, height: 8, backgroundColor: '#fff', borderRadius: 4 },
  centerPinStick: { width: 3, height: 14, backgroundColor: '#374151', marginTop: -2, zIndex: 1 },
  centerPinShadow: { width: 12, height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6, marginTop: -2 },

  bottomAreaContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 16 },
  selectingCard: { padding: 20 },
  dragHint: { color: '#6b7280', fontWeight: '600', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  confirmBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  
  doneSheetWrapper: { maxHeight: height * 0.65 },
  sheetScroll: { padding: 20, paddingBottom: 24 },
  locationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  locLeft: { width: 24, alignItems: 'center', marginTop: 4 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  locLine: { width: 2, height: 30, backgroundColor: '#e5e7eb', marginVertical: 4 },
  squareOrange: { width: 8, height: 8, backgroundColor: '#d97706', borderRadius: 2 },
  locMiddle: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  locInputBox: { justifyContent: 'center' },
  locLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  locValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locValue: { fontSize: 15, fontWeight: '700', color: '#111827', flexShrink: 1 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },

  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12, marginTop: 16 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '700', color: '#059669' },
  bannerSub: { fontSize: 11, color: '#4b5563' },
  routeOptsBtn: { flexDirection: 'row', alignItems: 'center' },
  routeOptsText: { fontSize: 11, fontWeight: 'bold', color: '#d97706', marginLeft: 4 },

  vehicleRow: { marginTop: 20, paddingBottom: 8, gap: 12 },
  vehicleCard: { width: 100, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 12 },
  vehicleCardActive: { borderColor: '#d97706', backgroundColor: '#fffbeb', borderWidth: 2 },
  vehTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 12 },
  vehTime: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  vehPrice: { fontSize: 15, fontWeight: '800', color: '#d97706', marginTop: 6 },

  priceBreakdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  priceHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8 },
  priceSub: { fontSize: 11, color: '#6b7280', marginTop: 4, marginLeft: 16 },
  priceBig: { fontSize: 18, fontWeight: '800', color: '#111827' },
  priceSaveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  priceSave: { fontSize: 11, fontWeight: '600', color: '#059669', marginLeft: 4 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#92400e', paddingVertical: 18, borderRadius: 12, paddingHorizontal: 20 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginHorizontal: 12 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  navItem: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 10, color: '#888', fontWeight: '600', marginTop: 4 },
  navTextActive: { color: '#000' }
});
