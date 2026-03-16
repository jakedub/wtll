import axios from 'axios';
import type { Division } from '../models/division';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getDivision = async (): Promise<Division[]> => {
  const response = await axios.get<Division[]>(`${BASE_URL}/divisions/`);
  return response.data;
};
