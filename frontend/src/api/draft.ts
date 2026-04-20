import axios from 'axios';
import type { Draft, DraftSelection } from '../models/draft';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Draft API
export const getDrafts = async (): Promise<Draft[]> => {
  const response = await axios.get<Draft[]>(`${BASE_URL}/draft/`);
  return response.data;
};

export const createDraft = async (
  name: string,
  year: number,
  divisionId: number
): Promise<Draft> => {
  const response = await axios.post<Draft>(`${BASE_URL}/draft/`, {
    name,
    year,
    division: divisionId,  // <-- required now
  });
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
) => {
  return axios.post(`${BASE_URL}/draft/${draftId}/players/`, {
    team_id: teamId,
    division_id: divisionId,
    player_ids: playerIds, // 👈 enforce array only
  })
}

export const undoDraftPlayers = async (
  draftId: number,
  teamId: number,
  divisionId: number,
  playerIds: number[]
) => {
  const results = await Promise.all(
    playerIds.map((playerId) =>
      axios.delete(`${BASE_URL}/draft/${draftId}/players/`, {
        data: {
          team_id: teamId,
          division_id: divisionId,
          player_ids: [playerId],
        }
      })
    )
  );

  return results.map(r => r.data);
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

// Team Balance
// Frontend: src/api/draft.ts
export const getDraftTeamBalance = async (
  divisionId: number
): Promise<{
  team_id: number;
  team_name: string;
  balance: number;
}[]> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const response = await axios.get(`${baseUrl}/division/${divisionId}/team-balance/`);
  return response.data;
};

//Export Draft results and make complete
export const exportDraftCSV = (draftId: number): void => {
  const url = `${BASE_URL}/draft/${draftId}/export/`;
  const a = document.createElement('a');
  a.href = `${BASE_URL}/draft/${draftId}/export/`;
  a.download = `draft_${draftId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const markDraftComplete = async (draftId: number): Promise<void> => {
  await axios.post(`${BASE_URL}/draft/${draftId}/complete/`);
};

export const saveDraftTeams = async (draftId: number, teamIds: number[]): Promise<void> => {
  await axios.post(`${BASE_URL}/draft/${draftId}/save-teams/`, { team_ids: teamIds });
};

export const updatePlayerTier = async (playerId: number, tier: number) => {
  await fetch(`/api/players/${playerId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: String(tier) }),
  });
};

export const exportJerseyRosters = (): void => {
  const a = document.createElement('a');
  a.href = `${BASE_URL}/exports/jersey-roster`;
  a.download = 'jersey_rosters.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};