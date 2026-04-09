import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Car3DViewer({ color = "#3b82f6" }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.2, 0.95, 0.3]}>
        <boxGeometry args={[0.4, 0.02, 0.3]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.5, 0.15, 0.52]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.5, 0.15, 0.52]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.5, 0.15, -0.52]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.5, 0.15, -0.52]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.9, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.5, 0.18, 0.7]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.9, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.5, 0.18, 0.7]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function MatriculaPlaca({ matricula }) {
  const formatMatricula = (mat) => {
    if (!mat) return '----';
    const clean = mat.replace(/\s/g, '').toUpperCase();
    if (clean.length === 7) {
      return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    }
    return mat.toUpperCase();
  };

  return (
    <div style={styles.matriculaPlaca}>
      <div style={styles.matriculaFlag}>
        <svg width="40" height="32" viewBox="0 0 40 32">
          <rect width="13.33" height="32" fill="#c60b1e"/>
          <rect x="13.33" width="13.33" height="32" fill="#ffc400"/>
          <rect x="26.66" width="13.34" height="32" fill="#003399"/>
        </svg>
      </div>
      <div style={styles.matriculaContent}>
        <div style={styles.matriculaLetter}>E</div>
        <div style={styles.matriculaPais}>ESPAÑA</div>
      </div>
      <div style={styles.matriculaNumber}>{formatMatricula(matricula)}</div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const ClientDashboard = () => {
  const { user, logout, loading: userLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [coches, setCoches] = useState([]);
  const [selectedCoche, setSelectedCoche] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItvModal, setShowItvModal] = useState(false);
  const [editingItvCoche, setEditingItvCoche] = useState(null);
  const [itvDate, setItvDate] = useState('');
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('garage');

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/');
    }
  }, [user, userLoading, navigate]);

  if (userLoading || !user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}>Cargando...</div>;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cochesRes, citasRes] = await Promise.all([
        api.coches.list(),
        api.citas.list()
      ]);
      setCoches(Array.isArray(cochesRes) ? cochesRes : []);
      setCitas(Array.isArray(citasRes) ? citasRes : []);
      if (cochesRes.length > 0 && !selectedCoche) {
        setSelectedCoche(cochesRes[0]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadItvAlerts = async () => {
    try {
      const res = await api.coches.getItvAlerts();
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleSaveItv = async () => {
    try {
      await api.coches.updateItv(editingItvCoche.id, itvDate);
      setShowItvModal(false);
      setEditingItvCoche(null);
      setItvDate('');
      loadData();
    } catch (err) {
      alert('Error al guardar ITV');
    }
  };

  const openItvModal = (coche) => {
    setEditingItvCoche(coche);
    setItvDate(coche.itv_vigencia || '');
    setShowItvModal(true);
  };

  const loadHistorial = async (cocheId) => {
    try {
      const res = await api.historial.list();
      const filtered = Array.isArray(res) ? res.filter(h => h.coche_id === cocheId) : [];
      setHistorial(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCoche) {
      loadHistorial(selectedCoche.id);
    }
  }, [selectedCoche]);

  const handleAddCoche = async () => {
    try {
      await api.coches.create(formData);
      setShowModal(false);
      setFormData({});
      loadData();
    } catch (err) {
      alert('Error al agregar coche');
    }
  };

  const getEstadoStyle = (estado) => {
    const styles = {
      pendiente: { bg: '#f59e0b', text: 'Pendiente' },
      aceptado: { bg: '#10b981', text: 'Aceptado' },
      rechazado: { bg: '#ef4444', text: 'Rechazado' },
      en_proceso: { bg: '#3b82f6', text: 'En Proceso' },
      completada: { bg: '#6366f1', text: 'Completada' },
      cancelada: { bg: '#64748b', text: 'Cancelada' }
    };
    return styles[estado] || { bg: '#64748b', text: estado };
  };

  const menuItems = [
    { id: 'garage', label: 'Mi Garage', icon: '🚗' },
    { id: 'citas', label: 'Mis Citas', icon: '📅' },
    { id: 'historial', label: 'Historial', icon: '📋' },
    { id: 'itv', label: 'ITV', icon: '📋' },
  ];

  if (loading) return <div style={styles.loading}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🚗</span>
          <span style={styles.logoText}>MiGarage</span>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                ...(activeTab === item.id ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={() => { logout(); navigate('/'); }} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>🚗</span>
            <span style={styles.headerTitle}>MiGarage</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.userName}>{user?.email?.split('@')[0]}</span>
          </div>
        </header>

        <div style={styles.content}>
          {activeTab === 'garage' && (
            <div>
              <div style={styles.topBar}>
                <h2 style={styles.pageTitle}>Mi Garage</h2>
                <button onClick={() => { setShowModal(true); setFormData({}); }} style={styles.addBtn}>
                  + Agregar Vehículo
                </button>
              </div>

              <div style={styles.garageLayout}>
                <div style={styles.carList}>
                  <h3 style={styles.sectionTitle}>Mis Vehículos</h3>
                  {coches.length === 0 ? (
                    <div style={styles.emptyState}>
                      <span style={styles.emptyIcon}>🚗</span>
                      <p>No tienes vehículos registrados</p>
                    </div>
                  ) : (
                    coches.map((coche, index) => (
                      <div
                        key={coche.id}
                        style={{
                          ...styles.carCard,
                          ...(selectedCoche?.id === coche.id ? styles.carCardSelected : {}),
                          borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                        }}
                        onClick={() => setSelectedCoche(coche)}
                      >
                        <div style={styles.carCardContent}>
                          <span style={styles.carMatricula}>{coche.matricula}</span>
                          <span style={styles.carModel}>{coche.marca} {coche.modelo}</span>
                          <span style={styles.carYear}>{coche.anio || '-'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.carViewer}>
                  {selectedCoche ? (
                    <>
                      <div style={styles.viewer3d}>
                        <Canvas camera={{ position: [4, 2, 4] }}>
                          <OrbitControls />
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[10, 10, 5]} intensity={1} />
                          <Car3DViewer color="#3b82f6" />
                        </Canvas>
                        <div style={styles.viewerHint}>Arrastra para rotar</div>
                      </div>

                      <div style={styles.carDetails}>
                        <div style={styles.carTitleRow}>
                          <div>
                            <h3 style={styles.detailTitle}>{selectedCoche.marca} {selectedCoche.modelo}</h3>
                            <span style={{color: '#888', fontSize: '14px'}}>{selectedCoche.anio || '-'}</span>
                          </div>
                          <MatriculaPlaca matricula={selectedCoche.matricula} />
                        </div>
                        
                        <div style={styles.detailsGrid}>
                          <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>MATRÍCULA</span>
                            <span style={{...styles.detailValue, color: '#0ab1e6'}}>{selectedCoche.matricula}</span>
                          </div>
                          <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>KILOMETRAJE</span>
                            <span style={styles.detailValue}>{(selectedCoche.kilometraje || 0).toLocaleString()} km</span>
                          </div>
                          <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>ESTADO</span>
                            <span style={{...styles.statusBadge, background: selectedCoche.estado === 'aprobado' ? '#10b981' : '#f59e0b'}}>
                              {selectedCoche.estado === 'aprobado' ? '✓ Activo' : '⏳ Pendiente'}
                            </span>
                          </div>
                          <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>ITV</span>
                            {selectedCoche.itv_vigencia ? (
                              <span style={{...styles.detailValue, color: new Date(selectedCoche.itv_vigencia) < new Date() ? '#ef4444' : '#10b981'}}>
                                {new Date(selectedCoche.itv_vigencia).toLocaleDateString('es-ES')}
                              </span>
                            ) : (
                              <span style={{color: '#f59e0b', fontSize: '13px'}}>No registrada</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={styles.carActions}>
                          <button onClick={() => openItvModal(selectedCoche)} style={styles.actionBtn}>
                            📅 {selectedCoche.itv_vigencia ? 'Editar ITV' : 'Añadir ITV'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={styles.noSelection}>
                      <span style={styles.noSelectionIcon}>🚗</span>
                      <p>Selecciona un vehículo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'citas' && (
            <div>
              <div style={styles.topBar}>
                <h2 style={styles.pageTitle}>Mis Citas</h2>
                <button onClick={() => { setShowModal(true); setFormData({}); }} style={styles.addBtn}>
                  + Solicitar Cita
                </button>
              </div>
              <div style={styles.tableContainer}>
                {citas.length === 0 ? (
                  <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📅</span>
                    <p>No tienes citas solicitadas</p>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>VEHÍCULO</th>
                        <th style={styles.th}>FECHA</th>
                        <th style={styles.th}>HORA</th>
                        <th style={styles.th}>DESCRIPCIÓN</th>
                        <th style={styles.th}>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citas.map(cita => {
                        const estadoStyle = getEstadoStyle(cita.estado);
                        return (
                          <tr key={cita.id} style={styles.tr}>
                            <td style={styles.td}>
                              <span style={styles.matriculaSmall}>{cita.matricula}</span>
                            </td>
                            <td style={styles.td}>{cita.fecha}</td>
                            <td style={styles.td}>{cita.hora}</td>
                            <td style={styles.td}>{cita.descripcion || '-'}</td>
                            <td style={styles.td}>
                              <span style={{...styles.statusBadge, background: estadoStyle.bg}}>
                                {estadoStyle.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div>
              <h2 style={styles.pageTitle}>Historial de Servicios</h2>
              <div style={styles.tableContainer}>
                {historial.length === 0 ? (
                  <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📋</span>
                    <p>No hay historial disponible</p>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>FECHA</th>
                        <th style={styles.th}>TIPO</th>
                        <th style={styles.th}>DESCRIPCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map(h => (
                        <tr key={h.id} style={styles.tr}>
                          <td style={styles.td}>{h.creado_en?.split('T')[0]}</td>
                          <td style={styles.td}>{h.tipo}</td>
                          <td style={styles.td}>{h.descripcion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'itv' && <ItvTab loadItvAlerts={loadItvAlerts} openItvModal={openItvModal} />}

        </div>
      </main>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {activeTab === 'garage' ? (
              <>
                <h3 style={styles.modalTitle}>Agregar Vehículo</h3>
                <input
                  type="text"
                  placeholder="Matrícula"
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Marca"
                  value={formData.marca || ''}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Modelo"
                  value={formData.modelo || ''}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Año"
                  value={formData.anio || ''}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Kilometraje"
                  value={formData.kilometraje || ''}
                  onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                  style={styles.input}
                />
              </>
            ) : activeTab === 'citas' ? (
              <>
                <h3 style={styles.modalTitle}>Solicitar Cita</h3>
                <select
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Seleccionar Vehículo</option>
                  {coches.map(c => (
                    <option key={c.id} value={c.matricula}>{c.matricula} - {c.marca} {c.modelo}</option>
                  ))}
                </select>
                <input
                  type="date"
                  placeholder="Fecha"
                  value={formData.fecha || ''}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="time"
                  placeholder="Hora"
                  value={formData.hora || ''}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  style={styles.input}
                />
                <textarea
                  placeholder="Descripción del trabajo"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{...styles.input, height: '80px', resize: 'vertical'}}
                />
              </>
            ) : null}
            <div style={styles.modalActions}>
              <button 
                onClick={() => {
                  if (activeTab === 'citas') {
                    api.citas.create(formData).then(() => {
                      setShowModal(false);
                      setFormData({});
                      loadData();
                    }).catch(() => alert('Error al crear cita'));
                  } else {
                    handleAddCoche();
                  }
                }} 
                style={styles.saveBtn}
              >
                Solicitar
              </button>
              <button onClick={() => { setShowModal(false); setFormData({}); }} style={styles.cancelBtn}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showItvModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Fecha ITV - {editingItvCoche?.matricula}</h3>
            <p style={{color: '#888', marginBottom: '16px'}}>
              {editingItvCoche?.marca} {editingItvCoche?.modelo}
            </p>
            <label style={{color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block'}}>
              Fecha de vencimiento ITV:
            </label>
            <input
              type="date"
              value={itvDate}
              onChange={(e) => setItvDate(e.target.value)}
              style={styles.input}
            />
            <div style={styles.modalActions}>
              <button onClick={handleSaveItv} style={styles.saveBtn}>
                Guardar
              </button>
              <button onClick={() => { setShowItvModal(false); setEditingItvCoche(null); }} style={styles.cancelBtn}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItvTab = ({ loadItvAlerts, openItvModal }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await loadItvAlerts();
    setAlerts(data);
    setLoading(false);
  };

  const getStatusStyle = (status) => {
    const styles = {
      ok: { bg: '#10b981', text: 'OK', icon: '✅' },
      warning: { bg: '#f59e0b', text: 'Próximo', icon: '⚠️' },
      urgent: { bg: '#ef4444', text: 'Urgente', icon: '🚨' },
      expired: { bg: '#64748b', text: 'Vencida', icon: '❌' }
    };
    return styles[status] || styles.ok;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDays = (days) => {
    if (days < 0) return `Hace ${Math.abs(days)} días`;
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  };

  if (loading) return <div style={styles.loadingCenter}>Cargando alertas ITV...</div>;

  const expiredCount = alerts.filter(a => a.status === 'expired').length;
  const urgentCount = alerts.filter(a => a.status === 'urgent').length;
  const warningCount = alerts.filter(a => a.status === 'warning').length;

  return (
    <div>
      <h2 style={styles.pageTitle}>Alertas de ITV</h2>
      
      <div style={styles.statsRow}>
        <div style={{...styles.statCard, borderLeft: '4px solid #ef4444'}}>
          <span style={styles.statIcon}>🚨</span>
          <div>
            <span style={styles.statValue}>{expiredCount}</span>
            <span style={styles.statLabel}>Vencidas</span>
          </div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
          <span style={styles.statIcon}>⚠️</span>
          <div>
            <span style={styles.statValue}>{urgentCount}</span>
            <span style={styles.statLabel}>Urgentes</span>
          </div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #10b981'}}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <span style={styles.statValue}>{warningCount}</span>
            <span style={styles.statLabel}>Próximas</span>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        {alerts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📋</span>
            <p>No hay alertas de ITV</p>
            <p style={{fontSize: '13px', marginTop: '8px', color: '#666'}}>Registra la fecha de vencimiento de tu ITV</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>VEHÍCULO</th>
                <th style={styles.th}>ITV VIGENCIA</th>
                <th style={styles.th}>DÍAS</th>
                <th style={styles.th}>ESTADO</th>
                <th style={styles.th}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => {
                const statusStyle = getStatusStyle(alert.status);
                return (
                  <tr key={alert.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.matriculaSmall}>{alert.matricula}</span>
                      <br/>
                      <small style={{color: '#666'}}>{alert.marca} {alert.modelo}</small>
                    </td>
                    <td style={styles.td}>{formatDate(alert.itv_vigencia)}</td>
                    <td style={{...styles.td, color: statusStyle.bg, fontWeight: 'bold'}}>
                      {formatDays(alert.days_until_itv)}
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, background: statusStyle.bg}}>
                        {statusStyle.icon} {statusStyle.text}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => openItvModal(alert)} style={styles.editBtn}>📅 Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#1a1a2e', fontFamily: "'Inter', -apple-system, sans-serif" },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#888' },
  loadingCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#888' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '150px', background: '#16213e', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { fontSize: '32px' },
  statValue: { display: 'block', fontSize: '28px', fontWeight: '700', color: 'white' },
  statLabel: { display: 'block', fontSize: '13px', color: '#888', marginTop: '2px' },
  sidebar: { width: '260px', background: '#16213e', color: 'white', display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: '700' },
  nav: { flex: 1, padding: '20px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', textAlign: 'left', transition: 'all 0.2s' },
  navItemActive: { background: '#e94560', color: 'white' },
  navIcon: { fontSize: '18px' },
  sidebarFooter: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { background: '#16213e', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon: { fontSize: '24px' },
  headerTitle: { fontSize: '20px', fontWeight: '700', color: 'white' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  userName: { color: '#e94560', fontWeight: '600' },
  content: { padding: '30px', flex: 1, overflow: 'auto', width: '100%' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '24px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  addBtn: { padding: '12px 20px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  garageLayout: { display: 'grid', gridTemplateColumns: 'minmax(280px, 350px) 1fr', gap: '24px', width: '100%' },
  carList: { background: '#16213e', borderRadius: '12px', padding: '24px', height: 'fit-content' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#e94560', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  carCard: { padding: '16px', background: '#1a1a2e', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' },
  carCardSelected: { background: '#0f3460' },
  carCardContent: { display: 'flex', flexDirection: 'column', gap: '4px' },
  carMatricula: { fontWeight: '700', color: 'white', fontSize: '15px' },
  carModel: { color: '#888', fontSize: '14px' },
  carYear: { color: '#666', fontSize: '12px' },
  carViewer: { background: '#16213e', borderRadius: '12px', padding: '24px' },
  viewer3d: { background: '#1a1a2e', borderRadius: '12px', height: '300px', position: 'relative' },
  viewerHint: { position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', color: '#666', fontSize: '13px', background: '#16213e', padding: '8px 16px', borderRadius: '20px' },
  carDetails: { marginTop: '24px' },
  carTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  detailTitle: { fontSize: '22px', fontWeight: '700', color: 'white' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  detailBox: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px', background: '#1a1a2e', borderRadius: '8px' },
  detailLabel: { color: '#666', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' },
  detailValue: { color: 'white', fontSize: '16px', fontWeight: '600' },
  carActions: { marginTop: '20px', display: 'flex', gap: '12px' },
  actionBtn: { padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
  noSelection: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' },
  noSelectionIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#666' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  tableContainer: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f3460', color: '#e94560', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '14px 16px', borderBottom: '1px solid #1a1a2e', fontSize: '14px', color: '#ccc' },
  tr: { transition: 'background 0.2s' },
  matriculaSmall: { background: '#0ab1e6', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', fontFamily: 'Arial', border: '1px solid #fff' },
  statusBadge: { padding: '6px 14px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  matriculaPlaca: { 
    background: 'white',
    padding: '3px 6px', 
    borderRadius: '3px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    border: '2px solid #666',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    height: '38px'
  },
  matriculaFlag: {
    borderRadius: '2px',
    overflow: 'hidden',
    lineHeight: 0
  },
  matriculaContent: { 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: '2px'
  },
  matriculaLetter: { 
    color: '#003399',
    fontSize: '12px', 
    fontWeight: 'bold',
    lineHeight: 1.2
  },
  matriculaPais: { 
    color: '#003399', 
    fontSize: '5px', 
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },
  matriculaNumber: { 
    color: '#111', 
    fontSize: '18px', 
    fontWeight: 'bold', 
    fontFamily: 'Arial, sans-serif',
    letterSpacing: '2px',
    marginLeft: '8px'
  },
  editBtn: { padding: '6px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#16213e', padding: '30px', borderRadius: '16px', width: '450px' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '20px' },
  input: { width: '100%', padding: '12px 16px', marginBottom: '12px', border: '1px solid #333', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#1a1a2e', color: 'white' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '20px' },
  saveBtn: { flex: 1, padding: '12px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  cancelBtn: { flex: 1, padding: '12px', background: '#333', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
};

export default ClientDashboard;
