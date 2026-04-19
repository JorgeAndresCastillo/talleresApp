const API_URL = 'http://172.20.10.2:3000';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

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
    list: () => fetch(`${API_URL}/coches`, { headers: getHeaders() }).then(res => res.json()),
    create: (data: any) => fetch(`${API_URL}/coches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: number, data: any) => fetch(`${API_URL}/coches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json())
  },
  citas: {
    list: () => fetch(`${API_URL}/citas`, { headers: getHeaders() }).then(res => res.json()),
    create: (data: any) => fetch(`${API_URL}/citas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json())
  },
  trabajos: {
    list: () => fetch(`${API_URL}/trabajos`, { headers: getHeaders() }).then(res => res.json()),
    iniciar: (id: number) => fetch(`${API_URL}/trabajos/${id}/iniciar`, {
      method: 'PUT',
      headers: getHeaders()
    }).then(res => res.json()),
    completar: (id: number, data: any) => fetch(`${API_URL}/trabajos/${id}/completar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json())
  }
};