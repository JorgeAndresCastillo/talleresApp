import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

const MisTrabajos = () => {
  const { user, logout, loading: userLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrabajo, setSelectedTrabajo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [completarData, setCompletarData] = useState({ 
    descripcion: '', 
    precio: '',
    sugerencia: {
      descripcion: '',
      fecha: '',
      kilometraje: ''
    }
  });

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/');
    }
    if (user?.rol === 'admin') {
      navigate('/dashboard');
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (user?.rol === 'mecanico') {
      loadTrabajos();
    }
  }, [user]);

  if (userLoading || !user) {
    return <div style={styles.loading}>Cargando...</div>;
  }

  const loadTrabajos = async () => {
    setLoading(true);
    try {
      const res = await api.trabajos.misTrabajos();
      setTrabajos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleIniciar = async (id) => {
    try {
      await api.trabajos.iniciar(id);
      loadTrabajos();
    } catch (err) {
      alert('Error al iniciar trabajo');
    }
  };

  const handleCompletar = async (id) => {
    try {
      const sugerencia = completarData.sugerencia?.descripcion ? {
        descripcion: completarData.sugerencia.descripcion,
        fecha: completarData.sugerencia.fecha || null,
        kilometraje: completarData.sugerencia.kilometraje ? parseInt(completarData.sugerencia.kilometraje) : null
      } : null;
      
      await api.trabajos.completar(id, {
        descripcion: completarData.descripcion,
        precio: parseFloat(completarData.precio) || 0,
        sugerencia
      });
      setShowModal(false);
      setSelectedTrabajo(null);
      setCompletarData({ descripcion: '', precio: '', sugerencia: { descripcion: '', fecha: '', kilometraje: '' } });
      loadTrabajos();
    } catch (err) {
      alert('Error al completar trabajo');
    }
  };

  const openCompletarModal = (trabajo) => {
    setSelectedTrabajo(trabajo);
    setCompletarData({
      descripcion: trabajo.descripcion || '',
      precio: trabajo.precio || '',
      sugerencia: { descripcion: '', fecha: '', kilometraje: '' }
    });
    setShowModal(true);
  };

  const getEstadoStyle = (estado) => {
    const styles = {
      pendiente: { bg: '#f59e0b', text: 'Pendiente', icon: '⏳' },
      en_proceso: { bg: '#3b82f6', text: 'En Proceso', icon: '🔧' },
      completado: { bg: '#10b981', text: 'Completado', icon: '✅' },
      cancelada: { bg: '#64748b', text: 'Cancelado', icon: '❌' }
    };
    return styles[estado] || { bg: '#64748b', text: estado, icon: '❓' };
  };

  const trabajosPendientes = trabajos.filter(t => t.estado === 'pendiente');
  const trabajosEnProceso = trabajos.filter(t => t.estado === 'en_proceso');
  const trabajosCompletados = trabajos.filter(t => t.estado === 'completado');

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🔧</span>
          <span style={styles.logoText}>TallerPro</span>
        </div>
        
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.nombre}</span>
          <span style={styles.userRole}>Mecánico</span>
        </div>

        <nav style={styles.nav}>
          <button onClick={() => loadTrabajos()} style={{...styles.navItem, ...styles.navItemActive}}>
            <span style={styles.navIcon}>📋</span>
            <span>Mis Trabajos</span>
            <span style={styles.badge}>{trabajosPendientes.length}</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={() => { logout(); navigate('/'); }} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>🔧</span>
            <span style={styles.headerTitle}>Mis Trabajos</span>
          </div>
          <div style={styles.headerRight}>
            <button onClick={loadTrabajos} style={styles.refreshBtn}>🔄 Actualizar</button>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingCenter}>Cargando trabajos...</div>
          ) : (
            <>
              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <span style={styles.statIcon}>⏳</span>
                  <div>
                    <span style={styles.statValue}>{trabajosPendientes.length}</span>
                    <span style={styles.statLabel}>Pendientes</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statIcon}>🔧</span>
                  <div>
                    <span style={styles.statValue}>{trabajosEnProceso.length}</span>
                    <span style={styles.statLabel}>En Proceso</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statIcon}>✅</span>
                  <div>
                    <span style={styles.statValue}>{trabajosCompletados.length}</span>
                    <span style={styles.statLabel}>Completados</span>
                  </div>
                </div>
              </div>

              {trabajos.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>📋</span>
                  <p>No tienes trabajos asignados</p>
                </div>
              ) : (
                <div style={styles.trabajosList}>
                  {trabajosEnProceso.length > 0 && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>🔧 En Proceso</h3>
                      <div style={styles.cardsGrid}>
                        {trabajosEnProceso.map(trabajo => (
                          <TrabajoCard
                            key={trabajo.id}
                            trabajo={trabajo}
                            onIniciar={handleIniciar}
                            onCompletar={openCompletarModal}
                            getEstadoStyle={getEstadoStyle}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {trabajosPendientes.length > 0 && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>⏳ Pendientes</h3>
                      <div style={styles.cardsGrid}>
                        {trabajosPendientes.map(trabajo => (
                          <TrabajoCard
                            key={trabajo.id}
                            trabajo={trabajo}
                            onIniciar={handleIniciar}
                            onCompletar={openCompletarModal}
                            getEstadoStyle={getEstadoStyle}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {trabajosCompletados.length > 0 && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>✅ Completados</h3>
                      <div style={styles.cardsGrid}>
                        {trabajosCompletados.slice(0, 5).map(trabajo => (
                          <TrabajoCard
                            key={trabajo.id}
                            trabajo={trabajo}
                            onIniciar={handleIniciar}
                            onCompletar={openCompletarModal}
                            getEstadoStyle={getEstadoStyle}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showModal && selectedTrabajo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Completar Trabajo #{selectedTrabajo.id}</h3>
            
            <div style={styles.trabajoInfo}>
              <span style={styles.matricula}>{selectedTrabajo.matricula}</span>
              <span style={styles.carModel}>{selectedTrabajo.marca} {selectedTrabajo.modelo}</span>
            </div>

            <textarea
              placeholder="Descripción del trabajo realizado"
              value={completarData.descripcion}
              onChange={(e) => setCompletarData({...completarData, descripcion: e.target.value})}
              style={styles.textarea}
            />

            <input
              type="number"
              placeholder="Precio (€)"
              value={completarData.precio}
              onChange={(e) => setCompletarData({...completarData, precio: e.target.value})}
              style={styles.input}
            />

            <div style={styles.sugerenciaSection}>
              <h4 style={styles.sugerenciaTitle}>💡 Sugerencia de próximo servicio</h4>
              <input
                type="text"
                placeholder="Descripción (ej: Cambio de aceite en 5000km)"
                value={completarData.sugerencia.descripcion}
                onChange={(e) => setCompletarData({
                  ...completarData, 
                  sugerencia: {...completarData.sugerencia, descripcion: e.target.value}
                })}
                style={styles.input}
              />
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="date"
                  placeholder="Fecha próxima"
                  value={completarData.sugerencia.fecha}
                  onChange={(e) => setCompletarData({
                    ...completarData, 
                    sugerencia: {...completarData.sugerencia, fecha: e.target.value}
                  })}
                  style={{...styles.input, flex: 1}}
                />
                <input
                  type="number"
                  placeholder="Km próximo"
                  value={completarData.sugerencia.kilometraje}
                  onChange={(e) => setCompletarData({
                    ...completarData, 
                    sugerencia: {...completarData.sugerencia, kilometraje: e.target.value}
                  })}
                  style={{...styles.input, flex: 1}}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => handleCompletar(selectedTrabajo.id)} style={styles.completeBtn}>
                ✅ Completar
              </button>
              <button onClick={() => { setShowModal(false); setSelectedTrabajo(null); }} style={styles.cancelBtn}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrabajoCard = ({ trabajo, onIniciar, onCompletar, getEstadoStyle }) => {
  const estado = getEstadoStyle(trabajo.estado);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardId}>#{trabajo.id}</span>
        <span style={{...styles.statusBadge, background: estado.bg}}>
          {estado.icon} {estado.text}
        </span>
      </div>
      
      <div style={styles.cardBody}>
        <div style={styles.matriculaRow}>
          <span style={styles.matricula}>{trabajo.matricula}</span>
          <span style={styles.carModel}>{trabajo.marca} {trabajo.modelo}</span>
        </div>
        
        <p style={styles.descripcion}>{trabajo.descripcion || 'Sin descripción'}</p>
        
        {trabajo.cita_fecha && (
          <div style={styles.citaInfo}>
            📅 {trabajo.cita_fecha?.split('T')[0]} a las {trabajo.cita_hora?.substring(0, 5)}
          </div>
        )}
      </div>

      <div style={styles.cardFooter}>
        {trabajo.estado === 'pendiente' && (
          <button onClick={() => onIniciar(trabajo.id)} style={styles.iniciarBtn}>
            ▶️ Iniciar
          </button>
        )}
        {trabajo.estado === 'en_proceso' && (
          <button onClick={() => onCompletar(trabajo)} style={styles.completarBtn}>
            ✅ Completar
          </button>
        )}
        {trabajo.estado === 'completado' && trabajo.precio && (
          <span style={styles.precio}>💰 {parseFloat(trabajo.precio).toFixed(2)} €</span>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#1a1a2e', fontFamily: "'Inter', -apple-system, sans-serif" },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' },
  loadingCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#888' },
  sidebar: { width: '280px', background: '#16213e', color: 'white', display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: '700' },
  userInfo: { padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  userName: { display: 'block', fontSize: '16px', fontWeight: '600', color: 'white' },
  userRole: { display: 'block', fontSize: '13px', color: '#10b981', marginTop: '4px' },
  nav: { flex: 1, padding: '20px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', textAlign: 'left', transition: 'all 0.2s' },
  navItemActive: { background: '#e94560', color: 'white' },
  navIcon: { fontSize: '18px' },
  badge: { marginLeft: 'auto', background: '#e94560', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  sidebarFooter: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { background: '#16213e', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon: { fontSize: '24px' },
  headerTitle: { fontSize: '20px', fontWeight: '700', color: 'white' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  refreshBtn: { padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  content: { padding: '30px', flex: 1, overflow: 'auto' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '150px', background: '#16213e', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { fontSize: '32px' },
  statValue: { display: 'block', fontSize: '28px', fontWeight: '700', color: 'white' },
  statLabel: { display: 'block', fontSize: '13px', color: '#888', marginTop: '2px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#e94560', marginBottom: '16px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: '#16213e', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#0f3460' },
  cardId: { fontSize: '14px', fontWeight: '600', color: '#e94560' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
  cardBody: { padding: '20px' },
  matriculaRow: { marginBottom: '12px' },
  matricula: { display: 'inline-block', background: '#0ab1e6', color: '#000', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Arial', border: '1px solid #fff', marginRight: '8px' },
  carModel: { color: '#888', fontSize: '14px' },
  descripcion: { color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' },
  citaInfo: { color: '#888', fontSize: '13px' },
  cardFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' },
  iniciarBtn: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  completarBtn: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  precio: { color: '#10b981', fontSize: '16px', fontWeight: '600' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: '#666', background: '#16213e', borderRadius: '12px' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#16213e', padding: '30px', borderRadius: '16px', width: '450px', maxWidth: '90%' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '20px' },
  trabajoInfo: { background: '#1a1a2e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
  textarea: { width: '100%', padding: '12px 16px', marginBottom: '12px', border: '1px solid #333', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#1a1a2e', color: 'white', height: '100px', resize: 'vertical', fontFamily: 'inherit' },
  input: { width: '100%', padding: '12px 16px', marginBottom: '12px', border: '1px solid #333', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#1a1a2e', color: 'white' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '20px' },
  completeBtn: { flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  cancelBtn: { flex: 1, padding: '12px', background: '#333', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  sugerenciaSection: { marginTop: '16px', padding: '16px', background: '#1a1a2e', borderRadius: '8px', borderLeft: '3px solid #f59e0b' },
  sugerenciaTitle: { color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }
};

export default MisTrabajos;
