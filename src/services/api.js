import axios from 'axios';

//const API_URL = 'https://127.0.0.1:8000/'; // Base API URL
const API_URL = 'https://propcalc.zastrahovaite.com/'; // Base API URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;