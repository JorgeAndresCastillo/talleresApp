import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView, PanResponder, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api, setToken, getUser } from '../src/api';

interface Usuario { id: number; nombre: string; email: string; rol: string; movil: string; }
interface Coche { id: number; matricula: string; marca: string; modelo: string; anio: number; kilometraje: number; cliente_id: number; }
interface Cita { id: number; fecha: string; hora: string; estado: string; descripcion: string; matricula: string; }
interface Trabajo { id: number; descripcion: string; estado: string; matricula: string; precio: number; mecanico_id?: number; }

export default function DashboardScreen() {
  const router = useRouter();
  const user = getUser();
  const isAdmin = user?.rol === 'admin';
  const isMecanico = user?.rol === 'mecanico';
  
  const [selectedCliente, setSelectedCliente] = useState<Usuario | null>(null);
  const [detalleMode, setDetalleMode] = useState(false);
  const [selectedMecanico, setSelectedMecanico] = useState<Usuario | null>(null);
  const [mecanicoMode, setMecanicoMode] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cochesTodos, setCochesTodos] = useState<Coche[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [myJobs, setMyJobs] = useState<Trabajo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'clientes' | 'mecanicos' | 'citas' | 'trabajos' | 'taller'>('clientes');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Usuario | null>(null);
  const [editingMecanico, setEditingMecanico] = useState<Usuario | null>(null);
  const [showAddMecanicoModal, setShowAddMecanicoModal] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', movil: '', contrasena: '' });
  const [newMecanico, setNewMecanico] = useState({ nombre: '', email: '', movil: '', contrasena: '' });
  const [editData, setEditData] = useState({ nombre: '', email: '', movil: '' });

  const loadData = async () => {
    try {
      const promises = [];
      if (isAdmin) {
        promises.push(api.usuarios.list(), api.coches.list(), api.citas.list(), api.trabajos.list());
      } else if (isMecanico) {
        promises.push(api.trabajos.misTrabajos(), api.citas.list());
      } else {
        promises.push(api.coches.list(), api.citas.list());
      }
      const results = await Promise.all(promises);
      let i = 0;
      if (isAdmin) {
        setUsuarios(results[i]); setCochesTodos(results[++i]); setCitas(results[++i]); setTrabajos(results[++i]);
      } else if (isMecanico) {
        setMyJobs(results[i]); setCitas(results[++i]);
      } else {
        setCochesTodos(results[i]); setCitas(results[++i]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleAddClient = async () => {
    if (!newClient.nombre || !newClient.email || !newClient.movil || !newClient.contrasena) { Alert.alert('Todos los campos son obligatorios'); return; }
    try {
      const result = await api.usuarios.create({ nombre: newClient.nombre, email: newClient.email, movil: newClient.movil, contrasena: newClient.contrasena, rol: 'cliente' });
      if (result.id) { setShowAddModal(false); setNewClient({ nombre: '', email: '', movil: '', contrasena: '' }); loadData(); Alert.alert('Cliente creado'); }
      else { Alert.alert(result.msg || 'Error al crear'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const handleEditClient = async () => {
    if (!editData.nombre || !editData.email || !editData.movil) { Alert.alert('Todos los campos son obligatorios'); return; }
    try {
      const result = await api.usuarios.update(editingClient!.id, editData);
      if (result.id) { setEditingClient(null); loadData(); Alert.alert('Cliente actualizado'); }
      else { Alert.alert(result.msg || 'Error al actualizar'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const handleIniciarTrabajo = async (id: number) => {
    try {
      const result = await api.trabajos.iniciar(id);
      if (result.id) { loadData(); Alert.alert('Trabajo iniciado'); }
      else { Alert.alert(result.msg || 'Error'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const handleCompletarTrabajo = async (id: number) => {
    try {
      const result = await api.trabajos.completar(id, {});
      if (result.id) { loadData(); Alert.alert('Trabajo completado'); }
      else { Alert.alert(result.msg || 'Error'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const openEditCliente = (cliente: Usuario) => { setEditingClient(cliente); setEditData({ nombre: cliente.nombre, email: cliente.email, movil: cliente.movil }); };

  const handleAddMecanico = async () => {
    if (!newMecanico.nombre || !newMecanico.email || !newMecanico.movil || !newMecanico.contrasena) { Alert.alert('Todos los campos son obligatorios'); return; }
    try {
      const result = await api.usuarios.create({ ...newMecanico, rol: 'mecanico' });
      if (result.id) { setShowAddMecanicoModal(false); setNewMecanico({ nombre: '', email: '', movil: '', contrasena: '' }); loadData(); Alert.alert('Mecánico creado'); }
      else { Alert.alert(result.msg || 'Error al crear'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const handleEditMecanico = async () => {
    if (!editData.nombre || !editData.email || !editData.movil) { Alert.alert('Todos los campos son obligatorios'); return; }
    try {
      const result = await api.usuarios.update(editingMecanico!.id, editData);
      if (result.id) { setEditingMecanico(null); loadData(); Alert.alert('Mecánico actualizado'); }
      else { Alert.alert(result.msg || 'Error al actualizar'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const openEditMecanico = (mecanico: Usuario) => { setEditingMecanico(mecanico); setEditData({ nombre: mecanico.nombre, email: mecanico.email, movil: mecanico.movil }); };

  const renderCliente = ({ item }: { item: Usuario }) => (
    <TouchableOpacity style={styles.clienteCard} onPress={() => { setSelectedCliente(item); setDetalleMode(true); }}>
      <Text style={styles.clienteNombre}>{item.nombre}</Text>
      <Text style={styles.clienteEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  const renderMecanico = ({ item }: { item: Usuario }) => (
    <TouchableOpacity style={styles.clienteCard} onPress={() => { setSelectedMecanico(item); setMecanicoMode(true); }}>
      <Text style={styles.clienteNombre}>{item.nombre}</Text>
      <Text style={styles.clienteEmail}>{item.email}</Text>
      <Text style={styles.clienteMovil}>📱 {item.movil}</Text>
    </TouchableOpacity>
  );

  const renderDetalleCliente = () => {
    if (!selectedCliente || !detalleMode) return null;
    const clientCars = cochesTodos.filter(c => c.cliente_id === selectedCliente.id);
    const panResponder = PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10, onPanResponderMove: (_, g) => { if (g.dx > 50) setDetalleMode(false); } });
    return (
      <ScrollView style={styles.detalleView} {...panResponder.panHandlers}>
        <View style={styles.detalleActions}>
          <TouchableOpacity onPress={() => setDetalleMode(false)}><Text style={styles.backText}>← Volver</Text></TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditCliente(selectedCliente)}><Text style={styles.editBtnText}>✏️</Text></TouchableOpacity>
        </View>
        <View style={styles.detalleHeader}>
          <Text style={styles.detalleNombre}>{selectedCliente.nombre}</Text>
          <Text style={styles.detalleEmail}>{selectedCliente.email}</Text>
        </View>
        <Text style={styles.detalleSubtitle}>Vehículos ({clientCars.length})</Text>
        {clientCars.map(c => <View key={c.id} style={styles.detalleCoche}><Text style={styles.detalleMatricula}>{c.matricula}</Text><Text style={styles.detalleModelo}>{c.marca} {c.modelo}</Text></View>)}
      </ScrollView>
    );
  };

  const renderDetalleMecanico = () => {
    if (!selectedMecanico || !mecanicoMode) return null;
    const mecanicoJobs = trabajos.filter(t => t.mecanico_id === selectedMecanico.id);
    const panResponder = PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10, onPanResponderMove: (_, g) => { if (g.dx > 50) setMecanicoMode(false); } });
    return (
      <ScrollView style={styles.detalleView} {...panResponder.panHandlers}>
        <View style={styles.detalleActions}>
          <TouchableOpacity onPress={() => setMecanicoMode(false)}><Text style={styles.backText}>← Volver</Text></TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditMecanico(selectedMecanico)}><Text style={styles.editBtnText}>✏️</Text></TouchableOpacity>
        </View>
        <View style={styles.detalleHeader}>
          <Text style={styles.detalleNombre}>{selectedMecanico.nombre}</Text>
          <Text style={styles.detalleEmail}>{selectedMecanico.email}</Text>
          <Text style={styles.clienteMovil}>📱 {selectedMecanico.movil}</Text>
        </View>
        <Text style={styles.detalleSubtitle}>Trabajos ({mecanicoJobs.length})</Text>
        {mecanicoJobs.map(t => <View key={t.id} style={styles.detalleCoche}><Text style={styles.detalleMatricula}>{t.matricula}</Text><Text style={styles.detalleModelo}>{t.descripcion}</Text></View>)}
      </ScrollView>
    );
  };

  const renderCita = ({ item }: { item: Cita }) => {
    const ec: Record<string, string> = { pendiente: '#f59e0b', aceptado: '#10b981', rechazado: '#ef4444', en_proceso: '#3b82f6', completada: '#6366f1' };
    return <View style={styles.card}><Text style={styles.matricula}>{item.matricula}</Text><Text style={styles.info}>{item.fecha}</Text></View>;
  };

  const renderMiTrabajo = ({ item }: { item: Trabajo }) => {
    const ec: Record<string, string> = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981' };
    return (
      <View style={styles.miTrabajoCard}>
        <View><Text style={styles.miTrabajoMatricula}>{item.matricula}</Text><Text style={styles.precio}>{item.precio}€</Text></View>
        <Text style={styles.info}>{item.descripcion}</Text>
        <View style={[styles.badge, { backgroundColor: ec[item.estado] }]}><Text style={styles.badgeText}>{item.estado}</Text></View>
        {item.estado === 'pendiente' && <TouchableOpacity style={styles.iniciarBtn} onPress={() => handleIniciarTrabajo(item.id)}><Text style={styles.btnText}>▶ Iniciar</Text></TouchableOpacity>}
        {item.estado === 'en_proceso' && <TouchableOpacity style={styles.completarBtn} onPress={() => handleCompletarTrabajo(item.id)}><Text style={styles.btnText}>✓ Completar</Text></TouchableOpacity>}
      </View>
    );
  };

  const getTitle = () => isAdmin ? 'Admin' : isMecanico ? 'Mecánico' : 'Mi Garage';
  const getTabName = (t: string) => ({ clientes: 'Clientes', mecanicos: 'Mecánicos', citas: 'Citas', taller: 'Mi Taller', trabajos: 'Trabajos' }[t] || t);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.headerRight}>
          {tab === 'clientes' && isAdmin && <TouchableOpacity onPress={() => setShowAddModal(true)}><Text style={styles.addBtn}>+</Text></TouchableOpacity>}
          {tab === 'mecanicos' && isAdmin && <TouchableOpacity onPress={() => setShowAddMecanicoModal(true)}><Text style={styles.addBtn}>+</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => { setToken(null); router.replace('/login'); }}><Text style={styles.logoutBtn}>Salir</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabs}>
        {isAdmin && <TouchableOpacity style={styles.tab} onPress={() => setTab('clientes')}><Text style={tab === 'clientes' ? styles.tabTextActive : styles.tabText}>Clientes</Text></TouchableOpacity>}
        {isAdmin && <TouchableOpacity style={styles.tab} onPress={() => setTab('mecanicos')}><Text style={tab === 'mecanicos' ? styles.tabTextActive : styles.tabText}>Mecánicos</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.tab} onPress={() => setTab('citas')}><Text style={tab === 'citas' ? styles.tabTextActive : styles.tabText}>Citas</Text></TouchableOpacity>
        {isMecanico && <TouchableOpacity style={styles.tab} onPress={() => setTab('taller')}><Text style={tab === 'taller' ? styles.tabTextActive : styles.tabText}>Mi Taller</Text></TouchableOpacity>}
        {(isMecanico || isAdmin) && <TouchableOpacity style={styles.tab} onPress={() => setTab('trabajos')}><Text style={tab === 'trabajos' ? styles.tabTextActive : styles.tabText}>Trabajos</Text></TouchableOpacity>}
      </View>
      <View style={styles.currentTab}><Text style={styles.currentTabText}>{getTabName(tab)}</Text></View>
      {tab === 'clientes' && isAdmin ? detalleMode ? renderDetalleCliente() : <FlatList data={usuarios.filter(u => u.rol === 'cliente')} keyExtractor={i => i.id.toString()} renderItem={renderCliente} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<Text style={styles.empty}>Sin clientes</Text>} /> : 
       tab === 'mecanicos' && isAdmin ? mecanicoMode ? renderDetalleMecanico() : <FlatList data={usuarios.filter(u => u.rol === 'mecanico')} keyExtractor={i => i.id.toString()} renderItem={renderMecanico} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<Text style={styles.empty}>Sin mecánicos</Text>} /> :
       tab === 'citas' ? <FlatList data={citas} keyExtractor={i => i.id.toString()} renderItem={renderCita} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} /> :
       tab === 'taller' && isMecanico ? <FlatList data={myJobs} keyExtractor={i => i.id.toString()} renderItem={renderMiTrabajo} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<Text style={styles.empty}>Sin trabajos</Text>} /> :
       <FlatList data={trabajos} keyExtractor={i => i.id.toString()} renderItem={({ item }) => <View style={styles.card}><Text>{item.matricula}</Text></View>} contentContainerStyle={styles.list} />}
      {showAddModal && <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Nuevo Cliente</Text><TextInput style={styles.modalInput} placeholder="Nombre" value={newClient.nombre} onChangeText={t => setNewClient({...newClient, nombre: t})} /><TextInput style={styles.modalInput} placeholder="Email" value={newClient.email} onChangeText={t => setNewClient({...newClient, email: t})} keyboardType="email-address" /><TextInput style={styles.modalInput} placeholder="Móvil" value={newClient.movil} onChangeText={t => setNewClient({...newClient, movil: t})} keyboardType="phone-pad" /><TextInput style={styles.modalInput} placeholder="Contraseña" value={newClient.contrasena} onChangeText={t => setNewClient({...newClient, contrasena: t})} secureTextEntry /><View style={styles.modalButtons}><TouchableOpacity style={styles.modalBtn} onPress={handleAddClient}><Text style={styles.modalBtnText}>Crear</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddModal(false)}><Text style={styles.modalBtnTextCancel}>Cancelar</Text></TouchableOpacity></View></View></View>}
      {editingClient && <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Editar Cliente</Text><TextInput style={styles.modalInput} placeholder="Nombre" value={editData.nombre} onChangeText={t => setEditData({...editData, nombre: t})} /><TextInput style={styles.modalInput} placeholder="Email" value={editData.email} onChangeText={t => setEditData({...editData, email: t})} keyboardType="email-address" /><TextInput style={styles.modalInput} placeholder="Móvil" value={editData.movil} onChangeText={t => setEditData({...editData, movil: t})} keyboardType="phone-pad" /><View style={styles.modalButtons}><TouchableOpacity style={styles.modalBtn} onPress={handleEditClient}><Text style={styles.modalBtnText}>Guardar</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setEditingClient(null)}><Text style={styles.modalBtnTextCancel}>Cancelar</Text></TouchableOpacity></View></View></View>}
      {showAddMecanicoModal && <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Nuevo Mecánico</Text><TextInput style={styles.modalInput} placeholder="Nombre" value={newMecanico.nombre} onChangeText={t => setNewMecanico({...newMecanico, nombre: t})} /><TextInput style={styles.modalInput} placeholder="Email" value={newMecanico.email} onChangeText={t => setNewMecanico({...newMecanico, email: t})} keyboardType="email-address" /><TextInput style={styles.modalInput} placeholder="Móvil" value={newMecanico.movil} onChangeText={t => setNewMecanico({...newMecanico, movil: t})} keyboardType="phone-pad" /><TextInput style={styles.modalInput} placeholder="Contraseña" value={newMecanico.contrasena} onChangeText={t => setNewMecanico({...newMecanico, contrasena: t})} secureTextEntry /><View style={styles.modalButtons}><TouchableOpacity style={styles.modalBtn} onPress={handleAddMecanico}><Text style={styles.modalBtnText}>Crear</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddMecanicoModal(false)}><Text style={styles.modalBtnTextCancel}>Cancelar</Text></TouchableOpacity></View></View></View>}
      {editingMecanico && <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Editar Mecánico</Text><TextInput style={styles.modalInput} placeholder="Nombre" value={editData.nombre} onChangeText={t => setEditData({...editData, nombre: t})} /><TextInput style={styles.modalInput} placeholder="Email" value={editData.email} onChangeText={t => setEditData({...editData, email: t})} keyboardType="email-address" /><TextInput style={styles.modalInput} placeholder="Móvil" value={editData.movil} onChangeText={t => setEditData({...editData, movil: t})} keyboardType="phone-pad" /><View style={styles.modalButtons}><TouchableOpacity style={styles.modalBtn} onPress={handleEditMecanico}><Text style={styles.modalBtnText}>Guardar</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setEditingMecanico(null)}><Text style={styles.modalBtnTextCancel}>Cancelar</Text></TouchableOpacity></View></View></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerRight: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  addBtn: { color: '#10b981', fontSize: 32, fontWeight: 'bold' },
  logoutBtn: { color: '#fff', fontSize: 14, fontWeight: 'bold', paddingVertical: 6, paddingHorizontal: 16, backgroundColor: '#e94560', borderRadius: 8, overflow: 'hidden' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: '#888', fontSize: 14 },
  tabTextActive: { color: '#e94560', fontSize: 14, fontWeight: 'bold' },
  currentTab: { paddingHorizontal: 20, paddingBottom: 10 },
  currentTabText: { color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  list: { padding: 20 },
  card: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  clienteCard: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  clienteNombre: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  clienteEmail: { color: '#888' },
  clienteMovil: { color: '#666', fontSize: 12, marginTop: 4 },
  detalleView: { flex: 1 },
  detalleActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  backText: { color: '#e94560', fontSize: 16 },
  editBtn: { backgroundColor: '#3b82f6', padding: 8, borderRadius: 8 },
  editBtnText: { color: '#fff' },
  detalleHeader: { padding: 20 },
  detalleNombre: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  detalleEmail: { color: '#888' },
  detalleSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#e94560', margin: 20 },
  detalleMatricula: { fontSize: 18, fontWeight: 'bold', color: '#0ab1e6' },
  detalleModelo: { color: '#ccc' },
  detalleCoche: { backgroundColor: '#16213e', margin: 20, marginTop: 0, padding: 16, borderRadius: 12 },
  matricula: { fontSize: 18, fontWeight: 'bold', color: '#0ab1e6' },
  precio: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  info: { color: '#888', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  badgeText: { color: '#fff', fontSize: 12 },
  miTrabajoCard: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  miTrabajoMatricula: { fontSize: 20, fontWeight: 'bold', color: '#0ab1e6' },
  iniciarBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  completarBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#16213e', padding: 24, borderRadius: 16, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#1a1a2e', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, backgroundColor: '#e94560', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#333' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: '#ccc', fontSize: 16 }
});