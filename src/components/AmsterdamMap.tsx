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
    caption: 'Home base. Building the future of farming.',
    coordinates: [4.9041, 52.3676] as [number, number],
    zoom: 14
  },
  {
    name: 'Apollo Agriculture',
    caption: 'Amsterdam office. Where strategy meets execution.',
    coordinates: [4.890499, 52.365325] as [number, number],
    zoom: 15
  },
  {
    name: 'Nakuru, Kenya',
    caption: 'Serving smallholder farmers in the Rift Valley.',
    coordinates: [36.04418101125058, -0.29486913332733633] as [number, number],
    zoom: 14
  },
  {
    name: 'Nairobi, Kenya',
    caption: 'Apollo HQ. Where impossible problems get solved.',
    coordinates: [36.778706180168236, -1.2556971742421654] as [number, number],
    zoom: 14
  },
  {
    name: 'San Francisco',
    caption: 'Where it all started.',
    coordinates: [-122.41082156831577, 37.778590255955436] as [number, number],
    zoom: 16
  }
];

const AmsterdamMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const currentLocationIndex = useRef<number>(0);
  const isAnimating = useRef<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location>(LOCATIONS[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZXN0c2F1dmVyIiwiYSI6ImNtNTB4ODF1NzFoZjgyaHF3bWRwbXhzdDUifQ.8GwaYheqLbIJEb58x_-CLw';
    
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/estsauver/cm56kfvmt004q01podka2b1q9',
      center: LOCATIONS[0].coordinates,
      zoom: LOCATIONS[0].zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: false
    });

    const flyToNextLocation = () => {
      if (!mapInstance.current || isAnimating.current) return;

      isAnimating.current = true;

      // Fade out caption before flying
      setIsVisible(false);

      currentLocationIndex.current = (currentLocationIndex.current + 1) % LOCATIONS.length;
      const nextLocation = LOCATIONS[currentLocationIndex.current];

      // Update location and fade in after a short delay
      setTimeout(() => {
        setCurrentLocation(nextLocation);
        setIsVisible(true);
      }, 500);

      mapInstance.current.flyTo({
        center: nextLocation.coordinates,
        zoom: nextLocation.zoom,
        curve: 1.42,
        speed: 0.05,
        easing(t) {
          return t;
        }
      });
    };

    mapInstance.current.on('load', () => {
      if (!mapInstance.current) return;

      mapInstance.current.setFog({
        'color': 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });

      flyToNextLocation();
    });

    mapInstance.current.on('moveend', () => {
      isAnimating.current = false;
      flyToNextLocation();
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
        <div className="glass-panel px-6 py-4 max-w-md">
          <h2 className="font-beth-ellen text-xl mb-1">{currentLocation.name}</h2>
          <p className="text-sm text-muted-foreground">{currentLocation.caption}</p>
        </div>
      </div>
    </div>
  );
};

export default AmsterdamMap;
