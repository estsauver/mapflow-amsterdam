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
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Cleanup any existing map instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: AMSTERDAM_LOCATIONS[0].coordinates,
        zoom: AMSTERDAM_LOCATIONS[0].zoom,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      mapInstance.current = map;

      map.on('style.load', () => {
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

      const interval = setInterval(animateLocation, 10000);

      return () => {
        clearInterval(interval);
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapboxToken]);

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0 z-0">
        {!mapboxToken && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="glass-panel p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">Enter Mapbox Token</h2>
              <input
                type="text"
                placeholder="pk.eyJ1..."
                className="w-full p-2 rounded border bg-white/50"
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <p className="text-sm mt-2 text-muted-foreground">
                Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
              </p>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 pointer-events-none" />
    </div>
  );
};

export default AmsterdamMap;