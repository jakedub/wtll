import axios from 'axios';
import { PlayerRow } from '../hooks/usePlayers';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/** Geocode a single address */
export const geocodeAddress = async (address: string) => {
  const response = await axios.get(`${BASE_URL}/geocode/`, { params: { address } });
  return response.data;
};

/** Upload a CSV to create address lat/lng */
export const importAddressCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${BASE_URL}/players/upload_csv/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
export const serveKML = async () => {
  const response = await axios.get(`${BASE_URL}/serve-kml/`);
  return response.data;
};
/** Get KML coordinates for district polygons */
export const getKMLCoordinates = async () => {
  const response = await axios.get(`${BASE_URL}/kml-coordinates/`);
  return response.data;
};

/** Check all players against district polygons */
export const checkPlayersInDistrict = async (players: any[]) => {
  const response = await axios.post(
    `${BASE_URL}/check-in-district/`,
    { players }
  );
  return response.data;
};
/** Batch geocode players missing latitude/longitude */
export const geocodeMissingPlayers = async (selectedIds: number[]) => {
  const response = await axios.post(`${BASE_URL}/geocode-missing-players/`, { player_ids: selectedIds });
  return response.data;
};

/** Check a single address against district polygons */
export const checkSingleAddress = async (address: string) => {
  const response = await axios.get(`${BASE_URL}/check-address/`, { params: { address } });
  return response.data;
};
/** Check a player's eligibility */
export const checkPlayerEligibility = async () => {
  const response = await axios.post(`${BASE_URL}/check-player-eligibility/`);
  return response.data;
};