import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView, PanResponder, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api, setToken, getUser } from '../src/api';

interface Usuario { id: number; nombre: string; email: string; rol: string; movil: string; }
interface Coche { id: number; matricula: string; marca: string; modelo: string; anio: number; kilometraje: number; cliente_id: number; }
interface Cita { id: number; fecha: string; hora: string; estado: string; descripcion: string; matricula: string; }
interface Trabajo { id: number; descripcion: string; estado: string; matricula: string; precio: number; }

export default function DashboardScreen() {
  const router = useRouter();
  const user = getUser();
  const isAdmin = user?.rol === 'admin';
  const isMecanico = user?.rol === 'mecanico';
  
  const [selectedCliente, setSelectedCliente] = useState<Usuario | null>(null);
  const [detalleMode, setDetalleMode] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cochesTodos, setCochesTodos] = useState<Coche[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [myJobs, setMyJobs] = useState<Trabajo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'clientes' | 'citas' | 'trabajos' | 'taller'>('taller');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Usuario | null>(null);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', movil: '', contrasena: '' });
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

  const renderCliente = ({ item }: { item: Usuario }) => (
    <TouchableOpacity style={styles.clienteCard} onPress={() => { setSelectedCliente(item); setDetalleMode(true); }}>
      <Text style={styles.clienteNombre}>{item.nombre}</Text>
      <Text style={styles.clienteEmail}>{item.email}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.headerRight}>
          {tab === 'clientes' && isAdmin && <TouchableOpacity onPress={() => setShowAddModal(true)}><Text style={styles.addBtn}>+</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => { setToken(null); router.replace('/login'); }}><Text style={styles.logout}>Salir</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabs}>
        {isAdmin && <TouchableOpacity style={styles.tab} onPress={() => setTab('clientes')}><Text style={styles.tabText}>Clientes</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.tab} onPress={() => setTab('citas')}><Text style={styles.tabText}>Citas</Text></TouchableOpacity>
        {isMecanico && <TouchableOpacity style={styles.tab} onPress={() => setTab('taller')}><Text style={styles.tabText}>Mi Taller</Text></TouchableOpacity>}
        {(isMecanico || isAdmin) && <TouchableOpacity style={styles.tab} onPress={() => setTab('trabajos')}><Text style={styles.tabText}>Trabajos</Text></TouchableOpacity>}
      </View>
      {tab === 'clientes' && isAdmin ? detalleMode ? renderDetalleCliente() : <FlatList data={usuarios.filter(u => u.rol === 'cliente')} keyExtractor={i => i.id.toString()} renderItem={renderCliente} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<Text style={styles.empty}>Sin clientes</Text>} /> : 
       tab === 'citas' ? <FlatList data={citas} keyExtractor={i => i.id.toString()} renderItem={renderCita} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} /> :
       tab === 'taller' && isMecanico ? <FlatList data={myJobs} keyExtractor={i => i.id.toString()} renderItem={renderMiTrabajo} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<Text style={styles.empty}>Sin trabajos</Text>} /> :
       <FlatList data={trabajos} keyExtractor={i => i.id.toString()} renderItem={({ item }) => <View style={styles.card}><Text>{item.matricula}</Text></View>} contentContainerStyle={styles.list} />}
      {showAddModal && <View style={styles.modalOverlay}><View style={styles.modal}><Text>Nuevo Cliente</Text><TextInput placeholder="Nombre" onChangeText={t => setNewClient({...newClient, nombre: t})} /><TextInput placeholder="Email" onChangeText={t => setNewClient({...newClient, email: t})} /><TextInput placeholder="Móvil" onChangeText={t => setNewClient({...newClient, movil: t})} /><TextInput placeholder="Contraseña" onChangeText={t => setNewClient({...newClient, contrasena: t})} secureTextEntry /><TouchableOpacity onPress={handleAddClient}><Text>Crear</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowAddModal(false)}><Text>Cancelar</Text></TouchableOpacity></View></View>}
      {editingClient && <View style={styles.modalOverlay}><View style={styles.modal}><Text>Editar</Text><TextInput value={editData.nombre} onChangeText={t => setEditData({...editData, nombre: t})} /><TextInput value={editData.email} onChangeText={t => setEditData({...editData, email: t})} /><TextInput value={editData.movil} onChangeText={t => setEditData({...editData, movil: t})} /><TouchableOpacity onPress={handleEditClient}><Text>Guardar</Text></TouchableOpacity><TouchableOpacity onPress={() => setEditingClient(null)}><Text>Cancelar</Text></TouchableOpacity></View></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerRight: { flexDirection: 'row', gap: 15 },
  addBtn: { color: '#10b981', fontSize: 24 },
  logout: { color: '#e94560' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: '#888', fontSize: 14 },
  list: { padding: 20 },
  card: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  clienteCard: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  clienteNombre: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  clienteEmail: { color: '#888' },
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
  modal: { backgroundColor: '#16213e', padding: 24, borderRadius: 16, width: '85%' }
});