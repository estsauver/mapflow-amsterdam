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
  const currentLocationIndex = useRef<number>(0);
  const isFlying = useRef<boolean>(false);
  const autoAdvance = useRef<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<Location>(LOCATIONS[0]);
  const [isVisible, setIsVisible] = useState(true);

  const flyToLocation = (index: number, fast: boolean = false) => {
    if (!mapInstance.current || isFlying.current) return;

    isFlying.current = true;
    setIsVisible(false);
    currentLocationIndex.current = index;

    // For fast flights, preload destination tiles before starting animation
    if (fast) {
      preloadTilesForLocation(LOCATIONS[index]);
    }

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

  const onFlightComplete = () => {
    isFlying.current = false;
    setCurrentLocation(LOCATIONS[currentLocationIndex.current]);
    setIsVisible(true);

    // Schedule next flight after showing caption for a bit
    if (autoAdvance.current) {
      setTimeout(() => {
        if (autoAdvance.current) {
          flyToNextLocation();
        }
      }, 3000); // Show caption for 3 seconds before flying again
    }
  };

  const flyToNextLocation = (fast: boolean = false) => {
    const nextIndex = (currentLocationIndex.current + 1) % LOCATIONS.length;
    flyToLocation(nextIndex, fast);
  };

  const flyToPreviousLocation = (fast: boolean = false) => {
    const prevIndex = (currentLocationIndex.current - 1 + LOCATIONS.length) % LOCATIONS.length;
    flyToLocation(prevIndex, fast);
  };

  // Preload tiles for a specific location without moving the camera
  const preloadTilesForLocation = (location: Location) => {
    if (!mapInstance.current) return;

    mapInstance.current.easeTo({
      center: location.coordinates,
      zoom: location.zoom,
      pitch: 45,
      bearing: -17.6,
      duration: 0,
      preloadOnly: true
    });
  };

  // Preload tiles for all locations to improve fly animation smoothness
  const preloadAllLocations = () => {
    LOCATIONS.forEach((location, index) => {
      // Stagger the preloads slightly to avoid overwhelming the network
      setTimeout(() => {
        preloadTilesForLocation(location);
      }, index * 500);
    });
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
      center: LOCATIONS[0].coordinates,
      zoom: LOCATIONS[0].zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: false,
      // Increase tile cache to improve loading during fly animations
      maxTileCacheSize: 200
    });

    mapInstance.current.on('load', () => {
      if (!mapInstance.current) return;

      // Du Bois-inspired fog using parchment tones
      mapInstance.current.setFog({
        'color': 'rgb(232, 220, 200)',      // Parchment
        'high-color': 'rgb(210, 180, 140)', // Tan
        'horizon-blend': 0.2,
      });

      // Preload tiles for all locations to improve fly animation smoothness
      preloadAllLocations();

      // Start the animation cycle after initial load with a delay
      setTimeout(() => {
        if (autoAdvance.current) {
          flyToNextLocation();
        }
      }, 3000); // Show initial location for 3 seconds
    });

    // Use moveend to detect when flight completes
    mapInstance.current.on('moveend', () => {
      if (isFlying.current) {
        onFlightComplete();
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
      <div className="absolute inset-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 pointer-events-none z-10" />

      {/* Location caption */}
      <div
        className={`absolute bottom-8 left-8 z-20 transition-opacity duration-500 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-dubois-cream border-2 border-dubois-ink shadow-[3px_3px_0_0_rgba(26,26,26,0.8)] px-6 py-4 max-w-md">
          <h2 className="font-condensed uppercase tracking-wider text-xl mb-1 text-dubois-ink font-semibold">{currentLocation.name}</h2>
          <p className="text-sm text-dubois-charcoal">{currentLocation.caption}</p>
        </div>
      </div>
    </div>
  );
};

export default AmsterdamMap;
