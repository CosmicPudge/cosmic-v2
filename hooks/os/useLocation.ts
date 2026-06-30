"use client";

import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lon: number;
}

const DEFAULT_LOCATION: UserLocation = {
  lat: 40.9177,
  lon: -111.3994,
};

export default function useLocation() {
  const [location, setLocation] =
    useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported. Using default location.");
      setLocation(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation failed:", error.message);
        console.warn("Using default location.");

        setLocation(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  return location;
}