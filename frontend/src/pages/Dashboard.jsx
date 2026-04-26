import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

const Dashboard = () => {
  const { user, logout, loading: userLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const isAdmin = user?.rol === 'admin';
  const isMecanico = user?.rol === 'mecanico';

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/');
    }
  }, [user, userLoading, navigate]);

  if (userLoading || !user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}>Cargando...</div>;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'coches', label: 'Vehículos', icon: '🚗' },
    { id: 'citas', label: 'Citas', icon: '📅' },
    { id: 'trabajos', label: 'Trabajos', icon: '🔧' },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuarios', icon: '👥' }] : []),
    ...(isAdmin ? [{ id: 'solicitudes', label: 'Solicitudes Matrícula', icon: '🔄' }] : []),
    ...(isAdmin || isMecanico ? [{ id: 'inventario', label: 'Inventario', icon: '📦' }] : []),
    ...(isAdmin ? [{ id: 'facturas', label: 'Facturación', icon: '💰' }] : []),
    { id: 'historial', label: 'Historial', icon: '📋' },
  ];

  useEffect(() => {
    if (activeTab !== 'dashboard') loadData();
    else loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [coches, citas, trabajos] = await Promise.all([
        api.coches.list(),
        api.citas.list(),
        api.trabajos.list()
      ]);
      
      let pendingCitas = Array.isArray(citas) ? citas.filter(c => c.estado === 'pendiente') : [];
      
      setData({
        totalCoches: Array.isArray(coches) ? coches.length : 0,
        citasPendientes: pendingCitas.length,
        trabajosActivos: Array.isArray(trabajos) ? trabajos.filter(t => t.estado === 'en_proceso' || t.estado === 'pendiente').length : 0,
        recentCoches: Array.isArray(coches) ? coches.slice(0, 5) : [],
        recentCitas: pendingCitas.slice(0, 5),
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchers = {
        usuarios: api.usuarios.list,
        coches: api.coches.list,
        citas: api.citas.list,
        trabajos: api.trabajos.list,
        inventario: api.inventario.list,
        facturas: api.facturas.list,
        historial: api.historial.list,
        solicitudes: api.solicitudes.list
      };
      if (fetchers[activeTab]) {
        const result = await fetchers[activeTab]();
        if (Array.isArray(result)) {
          setData(prev => ({ ...prev, [activeTab]: result }));
        } else if (result.msg) {
          setData(prev => ({ ...prev, [activeTab]: [] }));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id, tipo) => {
    if (!confirm('¿Eliminar ' + tipo + ' con ID ' + id + '?')) return;
    try {
      if (tipo === 'usuarios') await api.usuarios.delete(id);
      else if (tipo === 'coches') await api.coches.delete(id);
      else if (tipo === 'citas') await api.citas.delete(id);
      else if (tipo === 'trabajos') await api.trabajos.delete(id);
      else if (tipo === 'inventario') await api.inventario.delete(id);
      setData(prev => ({ ...prev, [tipo]: prev[tipo]?.filter(item => 
        tipo === 'coches' ? item.matricula !== id : item.id !== id
      )}));
    } catch (err) {
      alert('Error al eliminar: ' + (err.message || 'Error'));
    }
  };

  const handleEdit = (item, tab) => {
    setEditingItem(item);
    const initialData = { ...item };
    if (tab === 'trabajos' && item.matricula) {
      initialData.matricula = item.matricula;
    }
    if (tab === 'citas' && item.estado === 'pendiente') {
      initialData.estado = 'aceptado';
    }
    setFormData(initialData);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (activeTab === 'usuarios') await api.usuarios.update(editingItem.id, formData);
      else if (activeTab === 'coches') await api.coches.update(editingItem.id, formData);
      else if (activeTab === 'trabajos') await api.trabajos.update(editingItem.id, formData);
      else if (activeTab === 'inventario') await api.inventario.update(editingItem.id, formData);
      else if (activeTab === 'citas') {
        await api.citas.updateEstado(editingItem.id, formData.estado || 'aceptado');
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      loadData();
      if (activeTab === 'dashboard') loadDashboardData();
    } catch (err) {
      alert('Error al actualizar: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleCreate = async () => {
    try {
      if (activeTab === 'usuarios') await api.usuarios.create(formData);
      else if (activeTab === 'coches') await api.coches.create(formData);
      else if (activeTab === 'citas') await api.citas.create(formData);
      else if (activeTab === 'trabajos') await api.trabajos.create(formData);
      else if (activeTab === 'inventario') await api.inventario.create(formData);
      setShowModal(false);
      setFormData({});
      loadData();
    } catch (err) {
      alert('Error al guardar');
    }
  };

  const getColumns = (tab) => {
    const columnsMap = {
      usuarios: ['id', 'nombre', 'dni', 'email', 'movil', 'rol'],
      coches: ['matricula', 'marca', 'modelo', 'anio', 'kilometraje', 'cliente_nombre'],
      citas: ['id', 'fecha', 'hora', 'estado', 'descripcion', 'matricula', 'cliente_nombre', 'mecanico_nombre'],
      trabajos: ['id', 'descripcion', 'precio', 'estado', 'matricula', 'mecanico_nombre'],
      inventario: ['id', 'nombre', 'categoria', 'stock', 'precio_venta'],
      facturas: ['id', 'fecha', 'importe', 'estado'],
      historial: ['id', 'tipo', 'descripcion', 'fecha', 'precio']
    };
    return columnsMap[tab] || [];
  };

  const getFormFields = () => {
    const fields = {
      usuarios: ['nombre', 'dni', 'email', 'contrasena', 'movil', 'rol'],
      coches: ['matricula', 'marca', 'modelo', 'anio', 'kilometraje'],
      citas: ['matricula', 'fecha', 'hora', 'descripcion'],
      trabajos: ['matricula', 'descripcion', 'precio', 'estado'],
      inventario: ['nombre', 'descripcion', 'categoria', 'stock', 'precio_compra', 'precio_venta']
    };
    return fields[activeTab] || [];
  };

  const getDeleteId = (item, tab) => {
    if (tab === 'coches') return item.matricula;
    return item.id;
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

  const renderDashboard = () => (
    <div>
      <h2 style={styles.pageTitle}>Panel de Control</h2>
      
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🚗</span>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>{data.totalCoches || 0}</span>
            <span style={styles.statLabel}>Total Vehículos</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📅</span>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>{data.citasPendientes || 0}</span>
            <span style={styles.statLabel}>Citas Pendientes</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🔧</span>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>{data.trabajosActivos || 0}</span>
            <span style={styles.statLabel}>Trabajos Activos</span>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Citas Pendientes de Aprobación</h3>
        </div>
        {data.recentCitas && data.recentCitas.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>VEHÍCULO</th>
                <th style={styles.th}>FECHA</th>
                <th style={styles.th}>HORA</th>
                <th style={styles.th}>DESCRIPCIÓN</th>
                <th style={styles.th}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCitas.map(cita => (
                <tr key={cita.id} style={styles.tr}>
                  <td style={styles.td}><span style={styles.matriculaSmall}>{cita.matricula}</span></td>
                  <td style={styles.td}>{cita.fecha}</td>
                  <td style={styles.td}>{cita.hora}</td>
                  <td style={styles.td}>{cita.descripcion || '-'}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleEdit(cita, 'citas')} style={styles.acceptBtn}>✓ Aprobar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>No hay citas pendientes</div>
)}
      </div>
    </div>
  );

  const handleAprobarSolicitud = async (id) => {
    if (!confirm('¿Aprobar el cambio de matrícula?')) return;
    try {
      await api.solicitudes.aprobar(id);
      loadData();
    } catch (err) {
      alert('Error al aprobar solicitud');
    }
  };

  const handleRechazarSolicitud = async (id) => {
    if (!confirm('¿Rechazar la solicitud?')) return;
    try {
      await api.solicitudes.rechazar(id);
      loadData();
    } catch (err) {
      alert('Error al rechazar solicitud');
    }
  };

  const renderSolicitudes = () => {
    const solicitudes = data.solicitudes || [];
    if (solicitudes.length === 0) {
      return (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📋</span>
          <p>No hay solicitudes de cambio de matrícula</p>
        </div>
      );
    }
    return (
      <div>
        <h2 style={styles.pageTitle}>Solicitudes de Cambio de Matrícula</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>CLIENTE</th>
                <th style={styles.th}>VEHÍCULO</th>
                <th style={styles.th}>MATRÍCULA ANTERIOR</th>
                <th style={styles.th}>MATRÍCULA NUEVA</th>
                <th style={styles.th}>FECHA</th>
                <th style={styles.th}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => (
                <tr key={sol.id} style={styles.tr}>
                  <td style={styles.td}>{sol.cliente_nombre}</td>
                  <td style={styles.td}>{sol.marca} {sol.modelo}</td>
                  <td style={styles.td}>{sol.matricula_anterior}</td>
                  <td style={{...styles.td, color: '#10b981', fontWeight: 'bold'}}>{sol.matricula_nueva}</td>
                  <td style={styles.td}>{new Date(sol.creado_en).toLocaleDateString('es-ES')}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleAprobarSolicitud(sol.id)} style={{...styles.actionBtn, background: '#10b981'}}>✓ Aprobar</button>
                    <button onClick={() => handleRechazarSolicitud(sol.id)} style={{...styles.actionBtn, background: '#ef4444', marginLeft: '8px'}}>✗ Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getLabel = (tab) => {
    const labels = { usuarios: 'Usuario', coches: 'Vehículo', citas: 'Cita', trabajos: 'Trabajo', inventario: 'Inventario', facturas: 'Factura', historial: 'Historial' };
    return labels[tab] || tab;
  };

  const renderTable = (tab) => {
    const items = data[tab] || [];
    const columns = getColumns(tab);
    const canEdit = true;
    const canDelete = ['usuarios', 'coches', 'citas', 'trabajos', 'inventario'].includes(tab);

    return (
      <div>
        <div style={styles.tableHeader}>
          <h2 style={styles.pageTitle}>{getLabel(tab)}s</h2>
          {['usuarios', 'coches', 'citas', 'trabajos', 'inventario'].includes(tab) && (
            <button onClick={() => { setShowModal(true); setEditingItem(null); setFormData({}); }} style={styles.addBtn}>
              + Agregar {getLabel(tab)}
            </button>
          )}
        </div>
        
        <div style={styles.tableContainer}>
          {items.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📭</span>
              <p>No hay {getLabel(tab)}s registrados</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={styles.th}>{col.replace('_', ' ').toUpperCase()}</th>
                  ))}
                  {(canEdit || canDelete) && <th style={styles.th}>ACCIONES</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const estadoStyle = getEstadoStyle(item.estado);
                  return (
                    <tr key={i} style={styles.tr}>
                      {columns.map(col => (
                        <td key={col} style={styles.td}>
                          {col === 'matricula' ? (
                            <span style={styles.matriculaSmall}>{item[col]}</span>
                          ) : col === 'estado' ? (
                            <span style={{...styles.statusBadge, background: estadoStyle.bg}}>{estadoStyle.text}</span>
                          ) : String(item[col] || '-')}
                        </td>
                      ))}
                      {(canEdit || canDelete) && (
                        <td style={styles.td}>
                          {canEdit && (
                            <button onClick={() => handleEdit(item, tab)} style={styles.editBtn}>Editar</button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(getDeleteId(item, tab), tab)} style={styles.deleteBtn}>✕</button>
                          )}
                        </td>
                      )}
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

  const renderModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>{editingItem ? 'Editar' : 'Agregar'} {activeTab}</h3>
        {activeTab === 'citas' && editingItem && editingItem.estado === 'pendiente' ? (
          <>
            <p style={styles.modalDesc}>Esta cita está pendiente. ¿Desea aceptarla o rechazarla?</p>
            <select
              value={formData.estado || 'aceptado'}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              style={styles.input}
            >
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
              <option value="en_proceso">En Proceso</option>
            </select>
          </>
        ) : (
          getFormFields().map(field => {
            if (field === 'rol') {
              return (
                <select
                  key={field}
                  value={formData[field] || 'cliente'}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  style={styles.input}
                >
                  <option value="cliente">Cliente</option>
                  <option value="mecanico">Mecánico</option>
                </select>
              );
            }
            if (field === 'estado') {
              return (
                <select
                  key={field}
                  value={formData[field] || 'pendiente'}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  style={styles.input}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptado">Aceptado</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              );
            }
            return (
              <input
                key={field}
                type={field === 'contrasena' ? 'password' : 'text'}
                placeholder={field === 'contrasena' ? 'contraseña' : field}
                value={formData[field] || ''}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                style={styles.input}
              />
            );
          })
        )}
        <div style={styles.modalActions}>
          <button onClick={editingItem ? handleUpdate : handleCreate} style={styles.saveBtn}>
            {editingItem ? 'Actualizar' : 'Guardar'}
          </button>
          <button onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}); }} style={styles.cancelBtn}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🔧</span>
          <span style={styles.logoText}>TallerPro</span>
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
            <span style={styles.headerIcon}>🔧</span>
            <span style={styles.headerTitle}>TallerPro</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.userRole}>{user?.rol?.toUpperCase()}</span>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Cargando...</div>
          ) : activeTab === 'dashboard' ? renderDashboard() : activeTab === 'solicitudes' ? renderSolicitudes() : renderTable(activeTab)}
        </div>
      </main>

      {showModal && renderModal()}
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#1a1a2e', fontFamily: "'Inter', -apple-system, sans-serif" },
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
  userRole: { background: '#e94560', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  content: { padding: '30px', flex: 1, overflow: 'auto' },
  loading: { textAlign: 'center', padding: '50px', color: '#666' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '24px' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '200px', background: '#16213e', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { fontSize: '32px' },
  statInfo: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '28px', fontWeight: '700', color: 'white' },
  statLabel: { fontSize: '13px', color: '#888', marginTop: '2px' },
  tableContainer: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tableTitle: { fontSize: '18px', fontWeight: '600', color: '#e94560' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f3460', color: '#e94560', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '14px 16px', borderBottom: '1px solid #1a1a2e', fontSize: '14px', color: '#ccc' },
  tr: { transition: 'background 0.2s' },
  matriculaSmall: { background: '#0ab1e6', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', fontFamily: 'Arial', border: '1px solid #fff' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#666' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  addBtn: { padding: '12px 20px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  acceptBtn: { padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  editBtn: { padding: '6px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: '500' },
  deleteBtn: { padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#16213e', padding: '30px', borderRadius: '16px', width: '450px' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '20px' },
  modalDesc: { color: '#888', marginBottom: '16px', fontSize: '14px' },
  input: { width: '100%', padding: '12px 16px', marginBottom: '12px', border: '1px solid #333', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#1a1a2e', color: 'white' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '20px' },
  saveBtn: { flex: 1, padding: '12px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  cancelBtn: { flex: 1, padding: '12px', background: '#333', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  actionBtn: { padding: '8px 16px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }
};

export default Dashboard;
