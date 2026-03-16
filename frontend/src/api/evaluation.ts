import axios from 'axios';
import type { Evaluation } from '../models/evaluation';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getEvaluations = async (): Promise<Evaluation[]> => {
  const response = await axios.get<Evaluation[]>(`${BASE_URL}/evaluations/`);
  return response.data;
};

export const getEvaluationById = async (id: number): Promise<Evaluation> => {
  const response = await axios.get<Evaluation>(`${BASE_URL}/evaluations/${id}/`);
  return response.data;
};

export const createEvaluation = async (data: Partial<Evaluation>): Promise<Evaluation> => {
  const response = await axios.post<Evaluation>(`${BASE_URL}/evaluations/`, data);
  return response.data;
};

export const importEvalCsv = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${BASE_URL}/evaluations-upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  } catch (err: any) {
    console.error('Failed to upload evaluation CSV:', err);
    throw err;
  }
};