import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const MoveXMap = ({ 
  pickup, 
  destination, 
  driver, 
  routeLine, 
  onMapReady,
  center 
}) => {
  const webViewRef = useRef(null);

  // Generate HTML for Leaflet
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #0f172a; }
        .leaflet-container { background: #0f172a; }
        .marker-pickup { background-color: #2563EB; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px; }
        .marker-dest { background-color: #EF4444; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px; }
        .marker-driver { background-color: #000; border: 2px solid #2563EB; border-radius: 4px; padding: 2px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${center?.lat || 28.6139}, ${center?.lng || 77.2090}], 13);
        
        // Use CartoDB Dark Matter tiles (Premium look, free)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        let pickupMarker, destMarker, driverMarker, polyline;

        function updateMap(data) {
          if (data.pickup) {
            if (pickupMarker) map.removeLayer(pickupMarker);
            pickupMarker = L.circleMarker([data.pickup.lat, data.pickup.lng], {
              color: 'white', fillColor: '#2563EB', fillOpacity: 1, radius: 8
            }).addTo(map);
          }
          if (data.dest) {
            if (destMarker) map.removeLayer(destMarker);
            destMarker = L.circleMarker([data.dest.lat, data.dest.lng], {
              color: 'white', fillColor: '#EF4444', fillOpacity: 1, radius: 8
            }).addTo(map);
          }
          if (data.driver) {
            if (driverMarker) map.removeLayer(driverMarker);
            driverMarker = L.circleMarker([data.driver.lat, data.driver.lng], {
              color: 'white', fillColor: '#000', fillOpacity: 1, radius: 6, weight: 3
            }).addTo(map);
          }
          if (data.routeLine && data.routeLine.length > 0) {
            if (polyline) map.removeLayer(polyline);
            polyline = L.polyline(data.routeLine, { color: '#2563EB', weight: 4 }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          } else if (pickupMarker && destMarker) {
             const group = new L.featureGroup([pickupMarker, destMarker]);
             map.fitBounds(group.getBounds(), { padding: [50, 50] });
          }
        }

        window.updateMap = updateMap;
        document.addEventListener('message', (e) => {
          updateMap(JSON.parse(e.data));
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      const data = { pickup, dest: destination, driver, routeLine };
      webViewRef.current.postMessage(JSON.stringify(data));
    }
  }, [pickup, destination, driver, routeLine]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onLoad={() => {
          if (onMapReady) onMapReady();
          const data = { pickup, dest: destination, driver, routeLine };
          webViewRef.current.postMessage(JSON.stringify(data));
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  map: { flex: 1 }
});

export default MoveXMap;
