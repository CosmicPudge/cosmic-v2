"use client";

import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lon: number;
}

export default function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported.");
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
        console.error("Failed to get location:", error);
      }
    );
  }, []);

  return location;
}