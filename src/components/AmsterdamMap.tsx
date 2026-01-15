import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Location = {
  name: string;
  caption: string;
  coordinates: [number, number];
  zoom: number;
};

const LOCATIONS: Location[] = [
  {
    name: 'Amsterdam',
    caption: 'Home base.',
    coordinates: [4.9041, 52.3676] as [number, number],
    zoom: 14
  },
  {
    name: 'Nakuru, Kenya',
    caption: 'Serving smallholder farmers in the Rift Valley.',
    coordinates: [36.04418101125058, -0.29486913332733633] as [number, number],
    zoom: 14
  },
  {
    name: 'Oregon',
    caption: 'Native Oregonian.',
    coordinates: [-122.6765, 45.5231] as [number, number],
    zoom: 12
  },
  {
    name: 'Medford, Massachusetts',
    caption: "Go Jumbo's!",
    coordinates: [-71.1062, 42.4184] as [number, number],
    zoom: 14
  },
  {
    name: 'San Francisco',
    caption: 'Climate Corporation, Mindsumo, and a deep appreciation for Software.',
    coordinates: [-122.41082156831577, 37.778590255955436] as [number, number],
    zoom: 16
  }
];

const AmsterdamMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const currentLocationIndex = useRef<number>(1);
  const isAnimating = useRef<boolean>(false);
  const autoAdvance = useRef<boolean>(true);
  const pendingLocationIndex = useRef<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location>(LOCATIONS[1]);
  const [isVisible, setIsVisible] = useState(true);

  const flyToLocation = (index: number, fast: boolean = false) => {
    if (!mapInstance.current) return;

    // Mark as animating and hide caption during flight
    isAnimating.current = true;
    setIsVisible(false);

    // Store the destination index to update caption when flight completes
    pendingLocationIndex.current = index;
    currentLocationIndex.current = index;

    mapInstance.current.flyTo({
      center: LOCATIONS[index].coordinates,
      zoom: LOCATIONS[index].zoom,
      curve: 1.42,
      speed: fast ? 1.2 : 0.05,
      easing(t) {
        return t;
      }
    });
  };

  const flyToNextLocation = (fast: boolean = false) => {
    const nextIndex = (currentLocationIndex.current + 1) % LOCATIONS.length;
    flyToLocation(nextIndex, fast);
  };

  const flyToPreviousLocation = (fast: boolean = false) => {
    const prevIndex = (currentLocationIndex.current - 1 + LOCATIONS.length) % LOCATIONS.length;
    flyToLocation(prevIndex, fast);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        autoAdvance.current = false;
        flyToNextLocation(true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        autoAdvance.current = false;
        flyToPreviousLocation(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZXN0c2F1dmVyIiwiYSI6ImNtNTB4ODF1NzFoZjgyaHF3bWRwbXhzdDUifQ.8GwaYheqLbIJEb58x_-CLw';

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/estsauver/cmkf7vxxn007v01qubjkm3t5t',
      center: LOCATIONS[1].coordinates,
      zoom: LOCATIONS[1].zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: false
    });

    mapInstance.current.on('load', () => {
      if (!mapInstance.current) return;

      // Du Bois-inspired fog using parchment tones
      mapInstance.current.setFog({
        'color': 'rgb(232, 220, 200)',      // Parchment
        'high-color': 'rgb(210, 180, 140)', // Tan
        'horizon-blend': 0.2,
      });

      // Don't immediately fly to next location on load
      // Let the 'idle' handler start the animation cycle after the initial view settles
      // This prevents the caption from changing before the map finishes loading
    });

    mapInstance.current.on('idle', () => {
      // Update caption when flight completes
      if (pendingLocationIndex.current !== null) {
        setCurrentLocation(LOCATIONS[pendingLocationIndex.current]);
        setIsVisible(true);
        pendingLocationIndex.current = null;
      }

      isAnimating.current = false;
      if (autoAdvance.current) {
        flyToNextLocation();
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 pointer-events-none" />

      {/* Location caption */}
      <div
        className={`absolute bottom-8 left-8 z-10 transition-opacity duration-500 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="dubois-panel px-6 py-4 max-w-md">
          <h2 className="dubois-title text-xl mb-1 text-dubois-ink">{currentLocation.name}</h2>
          <p className="text-sm text-dubois-charcoal">{currentLocation.caption}</p>
        </div>
      </div>
    </div>
  );
};

export default AmsterdamMap;
