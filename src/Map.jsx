import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { parks } from './parksData';
import * as turf from '@turf/turf';
import Openrouteservice from 'openrouteservice-js';
import { visitorCenters } from './visitorCenters';
import { parkPeaks } from './peakData';
import nationalParksData from './national_parks.geojson';

const usCenter = [39.8283, -98.5795];
const orsClient = new Openrouteservice.Directions({
  api_key: import.meta.env.VITE_ORS_API_KEY
});

// Helper function to format elevation
const formatElevation = (feet) => {
  return `${feet.toLocaleString()}′`;  // Using prime symbol for feet
};

const Map = () => {
  const [parkBoundaries, setParkBoundaries] = useState(null);
  const [sortedParks, setSortedParks] = useState([]);
  const [selectedParks, setSelectedParks] = useState([]);
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    const data = nationalParksData;
    const nationalParks = {
      ...data,
      features: data.features.filter(feature => 
        feature.properties.UNIT_TYPE === 'National Park'
      )
    };
    setParkBoundaries(nationalParks);

    // Log all park names from GeoJSON for debugging
    console.log('Park names from GeoJSON:', nationalParks.features.map(f => ({
      name: f.properties.PARKNAME,
      type: f.properties.UNIT_TYPE,
      hasVisitorCenter: !!visitorCenters[f.properties.PARKNAME] || !!visitorCenters[f.properties.PARKNAME + ' National Park']
    })));

    // Create sorted parks array with visitor center coordinates
    const parksWithLocations = nationalParks.features.map((feature, idx) => {
      const parkName = feature.properties.PARKNAME;
      let visitorCenter = visitorCenters[parkName];
      let usedName = parkName;
      if (!visitorCenter) {
        visitorCenter = visitorCenters[parkName + ' National Park'];
        usedName = parkName + ' National Park';
      }
      if (!visitorCenter) {
        console.warn(`⚠️ No visitor center found for "${parkName}" or "${parkName} National Park". Available visitor centers:`, 
          Object.keys(visitorCenters));
      }

      // If no visitor center data, fall back to centroid
      let location;
      if (visitorCenter) {
        location = visitorCenter;
        console.log(`✓ Found visitor center for ${usedName}`);
      } else {
        const centroid = turf.centroid(feature).geometry.coordinates;
        location = [centroid[1], centroid[0]];
        console.warn(`Using centroid for ${parkName} at [${location}]`);
      }

      return {
        idx,
        name: parkName,
        location,
        feature,
        hasVisitorCenter: !!visitorCenter
      };
    });
    
    // Sort by latitude (north to south)
    parksWithLocations.sort((a, b) => b.location[0] - a.location[0]);
    setSortedParks(parksWithLocations);
  }, []);

  useEffect(() => {
    if (selectedParks.length === 2) {
      const [start, end] = selectedParks;
      setRouteError(null);
      
      console.log('Calculating route between visitor centers:', {
        start: { name: start.name, location: start.location },
        end: { name: end.name, location: end.location }
      });

      orsClient
        .calculate({
          coordinates: [
            [start.location[1], start.location[0]], // Convert to [lng, lat]
            [end.location[1], end.location[0]]
          ],
          profile: 'cycling-regular',
          format: 'geojson',
          elevation: true,
          extra_info: ['steepness', 'surface', 'waytype']
        })
        .then(response => {
          if (!response.features || response.features.length === 0) {
            throw new Error('No route found between these parks');
          }

          const routeFeature = response.features[0];
          const segments = routeFeature.properties.segments[0];
          
          let elevationGainFeet = 0;
          if (segments.ascent !== undefined) {
            elevationGainFeet = Math.round(segments.ascent * 3.28084);
          } else if (routeFeature.geometry.coordinates && routeFeature.geometry.coordinates.length > 1) {
            for (let i = 1; i < routeFeature.geometry.coordinates.length; i++) {
              const elevDiff = routeFeature.geometry.coordinates[i][2] - routeFeature.geometry.coordinates[i-1][2];
              if (elevDiff > 0) {
                elevationGainFeet += Math.round(elevDiff * 3.28084);
              }
            }
          }

          setRoute(routeFeature.geometry.coordinates);
          const distanceMiles = (segments.distance * 0.000621371).toFixed(1);
          
          setRouteInfo({
            distance: distanceMiles,
            elevationGain: elevationGainFeet || 'Not available',
            startPark: start.name,
            endPark: end.name
          });
        })
        .catch(error => {
          console.error('Error calculating route:', error);
          setRoute(null);
          setRouteInfo(null);
          setRouteError(`Unable to find a cycling route between ${start.name} and ${end.name}. The parks might be too far apart or lack connecting roads.`);
        });
    } else {
      setRoute(null);
      setRouteInfo(null);
      setRouteError(null);
    }
  }, [selectedParks]);

  const handleParkClick = useCallback((park) => {
    setSelectedParks(prev => {
      if (prev.length === 2) {
        return [park];
      }
      if (prev.find(p => p.name === park.name)) {
        return prev;
      }
      return [...prev, park];
    });
  }, []);

  const parkStyle = {
    color: '#FFD700',
    weight: 6,
    fillOpacity: 0.35,
    fillColor: '#2ecc71',
    dashArray: '2, 6',
    opacity: 1,
  };

  const getMarkerStyle = (park) => {
    const isSelected = selectedParks.find(p => p.name === park.name);
    return {
      background: isSelected ? '#ff3b30' : 'rgba(0,0,0,0.85)',
      color: isSelected ? '#ffffff' : '#FFD700',
      fontWeight: 'bold',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '0.9em',
      border: `2px solid ${isSelected ? '#ff3b30' : '#fff'}`,
      boxShadow: '0 0 6px rgba(0,0,0,0.5)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    };
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapContainer
        center={usCenter}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
        {parkBoundaries && (
          <GeoJSON 
            data={parkBoundaries} 
            style={parkStyle}
          />
        )}
        {sortedParks.map((park, i) => {
          const peakInfo = parkPeaks[park.name] || parkPeaks[park.name.replace(' National Park', '')];
          return (
            <Marker 
              key={park.name + '-visitor-center'} 
              position={park.location}
              eventHandlers={{
                click: () => handleParkClick(park)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent>
                <div style={getMarkerStyle(park)}>
                  {i + 1}. {park.name.replace(' National Park', '')}
                  {peakInfo && (
                    <span style={{ marginLeft: '6px', fontSize: '0.9em' }}>
                      {formatElevation(peakInfo[1])}
                    </span>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{park.name}</h3>
                  {peakInfo && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Highest Point:</strong> {peakInfo[0]}<br />
                      <strong>Elevation:</strong> {peakInfo[1].toLocaleString()} ft ({Math.round(peakInfo[1] * 0.3048)}m)
                    </p>
                  )}
                  <small style={{ color: '#666' }}>Routes start/end at visitor center</small>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {route && (
          <Polyline
            positions={route.map(([lng, lat]) => [lat, lng])}
            color="#ff3b30"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>
      
      {(routeInfo || routeError) && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {routeInfo ? (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Route Information</h3>
              <p style={{ margin: '0.25rem 0' }}><strong>From:</strong> {routeInfo.startPark}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>To:</strong> {routeInfo.endPark}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Distance:</strong> {routeInfo.distance} miles</p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Elevation Gain:</strong>{' '}
                {typeof routeInfo.elevationGain === 'number' 
                  ? `${routeInfo.elevationGain} ft`
                  : routeInfo.elevationGain
                }
              </p>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                Routes are calculated between visitor centers
              </small>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff3b30' }}>Route Error</h3>
              <p style={{ margin: '0.25rem 0' }}>{routeError}</p>
            </>
          )}
          <button 
            onClick={() => {
              setSelectedParks([]);
              setRouteError(null);
            }} 
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#ff3b30',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default Map; 