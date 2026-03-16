import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const geocodeAddress = async (address: string) => {
  const response = await axios.get(`${BASE_URL}/geocode/`, { params: { address } });
  return response.data;
};

export const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${BASE_URL}/upload-csv/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
};

export const getKMLCoordinates = async () => {
  const response = await axios.get(`${BASE_URL}/kml-coordinates/`);
  return response.data;
};