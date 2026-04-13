import { useState, useEffect } from "react";

/**
 * Hook to track live user location using Geolocation API
 * @returns {Object} { location, error, isTracking }
 */
export function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const success = (pos) => {
      const { latitude, longitude } = pos.coords;
      setLocation([latitude, longitude]);
      setError(null);
    };

    const handleError = (err) => {
      console.error("Geolocation error:", err);
      let msg = "Unable to retrieve your location";
      if (err.code === 1) msg = "Please enable location access in settings";
      if (err.code === 2) msg = "Location signal lost";
      if (err.code === 3) msg = "Location request timed out";
      setError(msg);
      setIsTracking(false);
    };

    const watchId = navigator.geolocation.watchPosition(success, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, []);

  return { location, error, isTracking };
}
