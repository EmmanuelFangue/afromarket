'use client';

import { useState, useEffect } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void;
  clearLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState({
        coordinates: null,
        error: {
          code: 2,
          message: 'Geolocation is not supported by your browser',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
        loading: false,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          coordinates: null,
          error,
          loading: false,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  const clearLocation = () => {
    setState({
      coordinates: null,
      error: null,
      loading: false,
    });
  };

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
}
