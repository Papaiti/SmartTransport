import { getDistance } from 'geolib';

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export function calculateDistance(start: Location, end: Location): number {
  return getDistance(
    { latitude: start.lat, longitude: start.lng },
    { latitude: end.lat, longitude: end.lng }
  );
}

/**
 * Formats distance for display (meters or kilometers).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Rwanda context: Common transport hubs in Kigali
 */
export const KIGALI_HUBS = {
  NYABUGOGO: { lat: -1.9397, lng: 30.0447, name: "Nyabugogo Bus Park" },
  KIMIRONKO: { lat: -1.9351, lng: 30.1256, name: "Kimironko Bus Park" },
  REMERA: { lat: -1.9589, lng: 30.1219, name: "Remera Bus Park" },
  DOWNTOWN: { lat: -1.9441, lng: 30.0619, name: "Kigali City Market (Downtown)" },
};
