import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Location = {
  name: string;
  coordinates: [number, number];
  zoom: number;
};

const AMSTERDAM_LOCATIONS: Location[] = [
  {
    name: 'City Center',
    coordinates: [4.9041, 52.3676],
    zoom: 14
  },
  {
    name: 'Vondelpark',
    coordinates: [4.8721, 52.3579],
    zoom: 15
  },
  {
    name: 'Museum Quarter',
    coordinates: [4.8852, 52.3600],
    zoom: 15
  }
];

const AmsterdamMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZXN0c2F1dmVyIiwiYSI6ImNtNTB4ODF1NzFoZjgyaHF3bWRwbXhzdDUifQ.8GwaYheqLbIJEb58x_-CLw';
    
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/estsauver/cm56kfvmt004q01podka2b1q9',
      center: AMSTERDAM_LOCATIONS[0].coordinates,
      zoom: AMSTERDAM_LOCATIONS[0].zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    mapInstance.current.on('load', () => {
      if (!mapInstance.current) return;

      mapInstance.current.setFog({
        'color': 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });

      let currentLocationIndex = 0;
      const animateLocation = () => {
        if (!mapInstance.current) return;
        
        currentLocationIndex = (currentLocationIndex + 1) % AMSTERDAM_LOCATIONS.length;
        const nextLocation = AMSTERDAM_LOCATIONS[currentLocationIndex];
        
        mapInstance.current.easeTo({
          center: nextLocation.coordinates,
          zoom: nextLocation.zoom,
          duration: 8000,
          pitch: 45 + Math.random() * 10,
          bearing: -17.6 + Math.random() * 40 - 20,
        });
      };

      animationInterval.current = setInterval(animateLocation, 10000);
    });

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
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
    </div>
  );
};

export default AmsterdamMap;