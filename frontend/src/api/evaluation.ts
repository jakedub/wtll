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

export const getEvaluationRanking = async (divisionId?: number) => {
  const url = `${BASE_URL}/export-evaluations/`;
  const params = divisionId !== undefined ? { division: divisionId } : undefined;

  const response = await axios.get(url, { params });
  return response.data;
};

export const downloadEvaluationCSV = (divisionId?: number) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let url = `${baseUrl}/export-evaluations-csv/`;

    const divisionNum = Number(divisionId);
    if (!isNaN(divisionNum)) {
      url += `?division=${divisionNum}`;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluations_${!isNaN(divisionNum) ? divisionNum : 'all'}_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link); // Some browsers require link in DOM
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to download evaluation CSV:', error);
  }
};