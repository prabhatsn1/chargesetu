import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapPinPickerProps {
  initialCoords?: LatLng;
  onChange: (coords: LatLng) => void;
  height?: number;
}

const DEFAULT_REGION: Region = {
  // Falls back to central India if location permission is denied.
  latitude: 21.1458,
  longitude: 79.0882,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function MapPinPicker({ initialCoords, onChange, height = 260 }: MapPinPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(
    initialCoords ? { ...initialCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 } : DEFAULT_REGION,
  );

  useEffect(() => {
    if (initialCoords) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      const next: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(next);
      onChange(next);
      mapRef.current?.animateToRegion(next, 300);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ height }} className="overflow-hidden rounded-xl">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={(nextRegion) => {
          setRegion(nextRegion);
          onChange({ latitude: nextRegion.latitude, longitude: nextRegion.longitude });
        }}
      />
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Text style={{ fontSize: 32, marginBottom: 32 }}>📍</Text>
      </View>
    </View>
  );
}
