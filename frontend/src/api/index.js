const API_URL = 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  console.log("getHeaders - token:", token);
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export const api = {
  auth: {
    register: (data) => fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),

    login: (data) => fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json())
  },

  usuarios: {
    list: () => fetch(`${API_URL}/usuarios`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id, data) => fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id) => fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => res.json()),
    updateRol: (id, rol) => fetch(`${API_URL}/usuarios/${id}/rol`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ rol })
    }).then(res => res.json())
  },

  coches: {
    list: () => fetch(`${API_URL}/coches`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/coches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id, data) => fetch(`${API_URL}/coches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    updateEstado: (matricula, estado) => fetch(`${API_URL}/coches/${matricula}/estado`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ estado })
    }).then(res => res.json()),
    updateItv: (id, itv_vigencia) => fetch(`${API_URL}/coches/${id}/itv`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ itv_vigencia })
    }).then(res => res.json()),
    getItvAlerts: () => fetch(`${API_URL}/coches/alerts/itv`, { headers: getHeaders() }).then(res => res.json()),
    delete: (id) => fetch(`${API_URL}/coches/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => res.json())
  },

  citas: {
    list: () => fetch(`${API_URL}/citas`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/citas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    updateEstado: (id, estado) => fetch(`${API_URL}/citas/${id}/estado`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ estado })
    }).then(res => res.json()),
    update: (id, data) => fetch(`${API_URL}/citas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id) => fetch(`${API_URL}/citas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => res.json())
  },

  trabajos: {
    list: () => fetch(`${API_URL}/trabajos`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/trabajos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id, data) => fetch(`${API_URL}/trabajos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    iniciar: (id) => fetch(`${API_URL}/trabajos/${id}/iniciar`, {
      method: 'PUT',
      headers: getHeaders()
    }).then(res => res.json()),
    completar: (id, data) => fetch(`${API_URL}/trabajos/${id}/completar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    misTrabajos: () => fetch(`${API_URL}/trabajos/mis-trabajos`, { headers: getHeaders() }).then(res => res.json()),
    delete: (id) => fetch(`${API_URL}/trabajos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => res.json())
  },

  historial: {
    list: () => fetch(`${API_URL}/historial`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/historial`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json())
  },

  inventario: {
    list: () => fetch(`${API_URL}/inventario`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/inventario`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id, data) => fetch(`${API_URL}/inventario/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id) => fetch(`${API_URL}/inventario/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => res.json())
  },

  facturas: {
    list: () => fetch(`${API_URL}/facturas`, { headers: getHeaders() }).then(res => res.json())
  },

  notificaciones: {
    list: () => fetch(`${API_URL}/notificaciones`, { headers: getHeaders() }).then(res => res.json())
  },

  solicitudes: {
    list: () => fetch(`${API_URL}/solicitudes`, { headers: getHeaders() }).then(res => res.json()),
    create: (data) => fetch(`${API_URL}/solicitudes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    aprobar: (id) => fetch(`${API_URL}/solicitudes/${id}/aprobar`, {
      method: 'PUT',
      headers: getHeaders()
    }).then(res => res.json()),
    rechazar: (id) => fetch(`${API_URL}/solicitudes/${id}/rechazar`, {
      method: 'PUT',
      headers: getHeaders()
    }).then(res => res.json())
  }
};
