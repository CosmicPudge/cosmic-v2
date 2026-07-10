"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lon: number;
}

export default function RadarMap({
  lat,
  lon,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapRef.current) return;

      const L = (await import("leaflet")).default;

      // Prevent Leaflet from thinking the div is already initialized
      if ((mapRef.current as any)._leaflet_id) {
        (mapRef.current as any)._leaflet_id = null;
      }

      if (!leafletMap.current) {
        const map = L.map(mapRef.current).setView(
          [lat, lon],
          9
        );

        // Base map
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap contributors",
          }
        ).addTo(map);

        // Radar overlay
        try {
          const response = await fetch("/api/radar");

          if (response.ok) {
            const radar = await response.json();

            const latest =
              radar.radar.past[
                radar.radar.past.length - 1
              ];

            L.tileLayer(
  `${radar.host}${latest.path}/512/{z}/{x}/{y}/6/1_1.png`,
  {
    opacity: 0.7,
    attribution: "RainViewer",

    maxNativeZoom: 10,
    maxZoom: 18,
    minZoom: 0,

    errorTileUrl: "/tile-error.png",
  }
).addTo(map);
          }
        } catch (error) {
          console.error(error);
        }

        if (mounted) {
          leafletMap.current = map;
        }
      } else {
        leafletMap.current.setView([lat, lon]);
      }
    }

    initMap();

    return () => {
      mounted = false;

      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [lat, lon]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full overflow-hidden rounded-xl"
    />
  );
}