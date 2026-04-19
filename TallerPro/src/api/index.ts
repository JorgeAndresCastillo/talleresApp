import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.20.10.2:3000';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export const api = {
  auth: {
    login: (data: { email: string; contrasena: string }) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    register: (data: any) =>
      fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json())
  },
  coches: {
    list: async () => {
      const headers = await getHeaders();
      return fetch(`${API_URL}/coches`, { headers }).then(res => res.json());
    },
    create: async (data: any) => {
      const headers = await getHeaders();
      return fetch(`${API_URL}/coches`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      }).then(res => res.json());
    }
  },
  citas: {
    list: async () => {
      const headers = await getHeaders();
      return fetch(`${API_URL}/citas`, { headers }).then(res => res.json());
    },
    create: async (data: any) => {
      const headers = await getHeaders();
      return fetch(`${API_URL}/citas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      }).then(res => res.json());
    }
  },
  trabajos: {
    list: async () => {
      const headers = await getHeaders();
      return fetch(`${API_URL}/trabajos`, { headers }).then(res => res.json());
    }
  }
};