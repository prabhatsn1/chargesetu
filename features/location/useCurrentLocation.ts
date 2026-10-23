import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface Coords {
  latitude: number;
  longitude: number;
}

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) setPermissionDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      if (!cancelled) {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, permissionDenied };
}
