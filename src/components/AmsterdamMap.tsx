import React, { useEffect, useRef, useState } from 'react';
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
  const [windowLoaded, setWindowLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setWindowLoaded(true);
    };

    if (document.readyState === 'complete') {
      setWindowLoaded(true);
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !windowLoaded || mapInitialized) return;

    let map: mapboxgl.Map | null = null;
    let animationInterval: NodeJS.Timeout | null = null;

    const initializeMap = () => {
      try {
        mapboxgl.accessToken = 'pk.eyJ1IjoiZXN0c2F1dmVyIiwiYSI6ImNtNTB4ODF1NzFoZjgyaHF3bWRwbXhzdDUifQ.8GwaYheqLbIJEb58x_-CLw';
        
        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: AMSTERDAM_LOCATIONS[0].coordinates,
          zoom: AMSTERDAM_LOCATIONS[0].zoom,
          pitch: 45,
          bearing: -17.6,
          antialias: true
        });

        map.on('load', () => {
          if (!map) return;
          
          map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6
            }
          });

          map.setFog({
            'color': 'rgb(255, 255, 255)',
            'high-color': 'rgb(200, 200, 225)',
            'horizon-blend': 0.2,
          });

          setMapInitialized(true);
        });

        let currentLocationIndex = 0;
        const animateLocation = () => {
          if (!map) return;
          
          currentLocationIndex = (currentLocationIndex + 1) % AMSTERDAM_LOCATIONS.length;
          const nextLocation = AMSTERDAM_LOCATIONS[currentLocationIndex];
          
          map.easeTo({
            center: nextLocation.coordinates,
            zoom: nextLocation.zoom,
            duration: 8000,
            pitch: 45 + Math.random() * 10,
            bearing: -17.6 + Math.random() * 40 - 20,
          });
        };

        animationInterval = setInterval(animateLocation, 10000);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      if (map) {
        map.remove();
      }
      setMapInitialized(false);
    };
  }, [windowLoaded, mapInitialized]);

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