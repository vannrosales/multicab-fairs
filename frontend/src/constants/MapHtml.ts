export const getLeafletHtml = () => `
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
    window.isTrackingLive = false;

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

