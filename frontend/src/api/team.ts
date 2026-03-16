import axios from 'axios';
import type { Team } from '../models/team';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getTeams = async (): Promise<Team[]> => {
  const response = await axios.get<Team[]>(`${BASE_URL}/teams/`);
  return response.data;
};

export const getTeamsByDivision = async (divisionId: number): Promise<Team[]> => {
  const response = await axios.get<Team[]>(`${BASE_URL}/teams/by-division/${divisionId}/`);
  return response.data;
};