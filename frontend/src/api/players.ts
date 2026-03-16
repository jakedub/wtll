import axios from 'axios';
import type { Player } from '../models/player';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getPlayers = async (): Promise<Player[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/players/`);
    // If paginated, extract results array
    if ('results' in response.data) {
      return response.data.results;
    }
    // Otherwise, assume it's a plain array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    console.warn("Unexpected response shape:", response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return [];
  }
};

export const getDivisionCounts = async () => {
  const response = await axios.get('/api/division-counts/');
  return response.data;
};

export const getPlayerById = async (id: number): Promise<Player> => {
  try {
    const response = await axios.get<Player>(`${BASE_URL}/players/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching player with id ${id}:`, error);
    throw error;
  }
};


export const importPlayerCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${BASE_URL}/players/import/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};