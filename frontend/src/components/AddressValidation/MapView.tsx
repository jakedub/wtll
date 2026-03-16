// MapView.tsx
import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Polygon, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 39.7684, lng: -86.1581 };

export interface PlayerRow {
  player_id: number;        // unique ID
  first_name: string;
  last_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_eligible?: boolean;
  division?: {
    id: number;
    name: string;
  };
  in_district?: boolean;    // true if inside KML polygon
  [key: string]: any;       // optional for extra fields from CSV/API
}
export interface MapViewProps {
  kmlUrl?: string;       // URL to KML file (if you want to load it directly)
  kmlEndpoint?: string;  // API endpoint to fetch polygons (if parsing server-side)
  players?: PlayerRow[];
}

interface Coord {
  lat: number;
  lng: number;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  latitude: number;
  longitude: number;
  is_eligible?: boolean;
  division?: {
    id: number;
    name: string;
  };
}

const MapView: React.FC<MapViewProps> = ({ kmlEndpoint = "/api/kml-coordinates/", kmlUrl }) => {
  const [polygons, setPolygons] = useState<Coord[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [hoverLocked, setHoverLocked] = useState(false);

  // Fetch district polygons if kmlEndpoint provided
  useEffect(() => {
    if (!kmlEndpoint) return;

    const fetchPolygons = async () => {
      try {
        const response = await axios.get(kmlEndpoint);
        const data = response.data;
        if (data.polygons) {
          const formatted = data.polygons.map((poly: { lat: number; lng: number }[]) =>
            poly.map((coord) => ({ lat: Number(coord.lat), lng: Number(coord.lng) }))
          );
          setPolygons(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch KML polygons:", err);
      }
    };
    fetchPolygons();
  }, [kmlEndpoint]);

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get("/api/players/");
        const data: Player[] = Array.isArray(response.data) ? response.data : response.data.results;
        const excludedDivisions = [4, 5]
        const filteredPlayers = data.filter((p) =>
          p.latitude != null &&
          p.longitude != null &&
          p.division &&
          !excludedDivisions.includes(p.division.id)
        );

        setPlayers(filteredPlayers);
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    };
    fetchPlayers();
  }, []);

  // Fit map bounds to polygon
  useEffect(() => {
    if (mapInstance && polygons.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      polygons.forEach((poly) => poly.forEach((coord) => bounds.extend(coord)));
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, polygons]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={12} onLoad={onMapLoad}>
        {polygons.map((poly, idx) => (
          <Polygon
            key={idx}
            paths={poly}
            options={{
              fillColor: "#2b00ffff",
              fillOpacity: 0.3,
              strokeColor: "#2545acff",
              strokeOpacity: 1,
              strokeWeight: 2,
            }}
          />
        ))}

        {players.map((player) => (
          <Marker
            key={player.id}
            position={{ lat: player.latitude, lng: player.longitude }}
            icon={{
              url: player.is_eligible === false
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            }}
            onMouseOver={() => {
              if (!hoverLocked) {
                setHoveredPlayer(player);
              }
            }}
            onMouseOut={() => {
              if (!hoverLocked) {
                setHoveredPlayer(null);
              }
            }}
            onClick={() => {
              setHoveredPlayer(player);
              setHoverLocked(true);
            }}
          />
        ))}

        {hoveredPlayer && (
          <InfoWindow
            position={{ lat: hoveredPlayer.latitude, lng: hoveredPlayer.longitude }}
            onCloseClick={() => {
              setHoveredPlayer(null);
              setHoverLocked(false);
            }}
          >
            <div>
              <strong>{hoveredPlayer.first_name} {hoveredPlayer.last_name}</strong>
              <br />
              Lat: {hoveredPlayer.latitude.toFixed(5)}, Lng: {hoveredPlayer.longitude.toFixed(5)}
              <br />
              <strong>{hoveredPlayer.division?.name ?? "N/A"}</strong>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;