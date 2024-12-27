import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Location = {
  name: string;
  coordinates: [number, number];
  zoom: number;
};

const LOCATIONS: Location[] = [
  {
    name: 'Amsterdam City Center',
    coordinates: [4.9041, 52.3676],
    zoom: 14
  },
  {
    name: 'Apollo Agriculture Office',
    coordinates: [4.890499, 52.365325],
    zoom: 16
  },
  {
    name: 'Nakuru',
    coordinates: [36.04418101125058, -0.29486913332733633],
    zoom: 12
  },
  {
    name: 'Nairobi',
    coordinates: [36.778706180168236, -1.2556971742421654],
    zoom: 12
  },
  {
    name: 'San Francisco',
    coordinates: [-122.41082156831577, 37.778590255955436],
    zoom: 16
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
      center: LOCATIONS[0].coordinates,
      zoom: LOCATIONS[0].zoom,
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
        
        currentLocationIndex = (currentLocationIndex + 1) % LOCATIONS.length;
        const nextLocation = LOCATIONS[currentLocationIndex];
        
        mapInstance.current.flyTo({
          center: nextLocation.coordinates,
          zoom: nextLocation.zoom,
          speed: 0.2,
          curve: 1,
          easing(t) {
            return t;
          }
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
      <div className="absolute top-8 left-8 z-10">
        <div className="glass-panel rounded-lg p-4">
          <h1 className="font-beth-ellen text-2xl text-foreground">
            Earl St Sauver
          </h1>
        </div>
      </div>
    </div>
  );
};

export default AmsterdamMap;