import axios from 'axios';
import type { Draft, DraftSelection } from '../models/draft';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Draft API
export const getDrafts = async (): Promise<Draft[]> => {
  const response = await axios.get<Draft[]>(`${BASE_URL}/draft/`);
  return response.data;
};

export const createDraft = async (name: string, year: number): Promise<Draft> => {
  const response = await axios.post<Draft>(`${BASE_URL}/draft/`, { name, year });
  return response.data;
};

export const getDraftById = async (draftId: number): Promise<Draft> => {
  const response = await axios.get<Draft>(`${BASE_URL}/draft/${draftId}/`);
  return response.data;
};

export const getDraftState = async (draftId: number) => {
  const response = await axios.get(`${BASE_URL}/draft/${draftId}/state/`);
  return response.data;
};

// Draft selections (players)
export const draftPlayers = async (
  draftId: number,
  teamId: number,
  divisionId: number,
  playerIds: number[]
): Promise<{ created: DraftSelection[]; failures: string[] }> => {
  const response = await axios.post(`${BASE_URL}/draft/${draftId}/players/`, {
    team_id: teamId,
    division_id: divisionId,
    player_ids: playerIds
  });
  return response.data;
};

export const undoDraftPlayers = async (
  draftId: number,
  teamId: number,
  divisionId: number,
  playerIds: number[]
): Promise<{ deleted_player_ids: number[]; failures: string[] }> => {
  const response = await axios.delete(`${BASE_URL}/draft/${draftId}/players/`, {
    data: { team_id: teamId, division_id: divisionId, player_ids: playerIds }
  });
  return response.data;
};

// Available players
export const getAvailablePlayers = async (
  draftId: number,
  divisionId: number
): Promise<DraftSelection[]> => {
  const response = await axios.get<DraftSelection[]>(
    `${BASE_URL}/draft/${draftId}/available-players/?division=${divisionId}`
  );
  return response.data;
};

// Team stats
export const getDraftTeamStats = async (draftId: number): Promise<{ team_id: number; team_name: string; pitchers: number; catchers: number }[]> => {
  const response = await axios.get(`${BASE_URL}/draft/${draftId}/team-stats/`);
  return response.data;
};