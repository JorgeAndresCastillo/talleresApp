import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView, PanResponder, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api, setToken, getUser } from '../src/api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  movil: string;
}

interface Coche {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  cliente_id: number;
}

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  descripcion: string;
  matricula: string;
}

interface Trabajo {
  id: number;
  descripcion: string;
  estado: string;
  matricula: string;
  precio: number;
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'clientes' | 'citas' | 'trabajos'>('clientes');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', movil: '', contrasena: '' });

  const loadData = async () => {
    try {
      const promises = [];
      if (isAdmin) {
        promises.push(api.usuarios.list());
        promises.push(api.coches.list());
        promises.push(api.citas.list());
        promises.push(api.trabajos.list());
      } else if (isMecanico) {
        promises.push(api.citas.list());
        promises.push(api.trabajos.list());
      } else {
        promises.push(api.coches.list());
        promises.push(api.citas.list());
      }
      const results = await Promise.all(promises);
      let i = 0;
      if (isAdmin) {
        if (Array.isArray(results[i])) setUsuarios(results[i++]);
        if (Array.isArray(results[i])) setCochesTodos(results[i++]);
        if (Array.isArray(results[i])) setCitas(results[i++]);
        if (Array.isArray(results[i])) setTrabajos(results[i++]);
      } else if (isMecanico) {
        if (Array.isArray(results[i])) setCitas(results[i++]);
        if (Array.isArray(results[i])) setTrabajos(results[i++]);
      } else {
        if (Array.isArray(results[i])) setCochesTodos(results[i++]);
        if (Array.isArray(results[i])) setCitas(results[i++]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleLogout = () => { setToken(null); router.replace('/login'); };

  const handleAddClient = async () => {
    if (!newClient.nombre || !newClient.email || !newClient.movil || !newClient.contrasena) {
      Alert.alert('Todos los campos son obligatorios'); return;
    }
    try {
      const result = await api.usuarios.create({
        nombre: newClient.nombre, email: newClient.email,
        movil: newClient.movil, contrasena: newClient.contrasena, rol: 'cliente'
      });
      if (result.id) {
        setShowAddModal(false);
        setNewClient({ nombre: '', email: '', movil: '', contrasena: '' });
        loadData();
        Alert.alert('Cliente creado');
      } else { Alert.alert(result.msg || 'Error al crear'); }
    } catch (e) { Alert.alert('Error de conexión'); }
  };

  const openClienteDetalle = (cliente: Usuario) => { setSelectedCliente(cliente); setDetalleMode(true); };

  const renderCliente = ({ item }: { item: Usuario }) => (
    <TouchableOpacity style={styles.clienteCard} onPress={() => openClienteDetalle(item)}>
      <Text style={styles.clienteNombre}>{item.nombre}</Text>
      <Text style={styles.clienteEmail}>{item.email}</Text>
      <Text style={styles.clienteMovil}>📱 {item.movil}</Text>
    </TouchableOpacity>
  );

  const renderDetalleCliente = () => {
    if (!selectedCliente || !detalleMode) return null;
    const clientCars = cochesTodos.filter(c => c.cliente_id === selectedCliente.id);
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => { if (g.dx > 50) setDetalleMode(false); }
    });
    return (
      <ScrollView style={styles.detalleView} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setDetalleMode(false)}>
          <Text style={styles.backText}>← Volver (swipe right)</Text>
        </TouchableOpacity>
        <View style={styles.detalleHeader}>
          <Text style={styles.detalleNombre}>{selectedCliente.nombre}</Text>
          <Text style={styles.detalleEmail}>{selectedCliente.email}</Text>
          <Text style={styles.detalleMovil}>📱 {selectedCliente.movil}</Text>
        </View>
        <Text style={styles.detalleSubtitle}>Vehículos ({clientCars.length})</Text>
        {clientCars.length > 0 ? clientCars.map(c => (
          <View key={c.id} style={styles.detalleCoche}>
            <Text style={styles.detalleMatricula}>{c.matricula}</Text>
            <Text style={styles.detalleModelo}>{c.marca} {c.modelo}</Text>
            <Text style={styles.detalleAno}>{c.anio} · {c.kilometraje?.toLocaleString()} km</Text>
          </View>
        )) : <Text style={styles.empty}>Sin vehículos</Text>}
      </ScrollView>
    );
  };

const renderCita = ({ item }: { item: Cita }) => {
    const ec: Record<string, string> = { pendiente: '#f59e0b', aceptado: '#10b981', rechazado: '#ef4444', en_proceso: '#3b82f6', completada: '#6366f1' };
    return (
      <View style={styles.card}>
        <View style={styles.citaRow}>
          <Text style={styles.matricula}>{item.matricula}</Text>
          <View style={[styles.badge, { backgroundColor: ec[item.estado] || '#64748b' }]}><Text style={styles.badgeText}>{item.estado}</Text></View>
        </View>
        <Text style={styles.info}>{item.fecha} a las {item.hora}</Text>
        <Text style={styles.info}>{item.descripcion}</Text>
      </View>
    );
  };

  const renderTrabajo = ({ item }: { item: Trabajo }) => {
    const ec: Record<string, string> = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981' };
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.citaRow}>
          <Text style={styles.matricula}>{item.matricula}</Text>
          <Text style={styles.precio}>{item.precio}€</Text>
        </View>
        <Text style={styles.info}>{item.descripcion}</Text>
        <View style={[styles.badge, { backgroundColor: ec[item.estado] || '#64748b', marginTop: 4 }]}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getTitle = () => isAdmin ? 'Admin - Talleres Castillo' : isMecanico ? 'Mecánico - Talleres Castillo' : 'Mi Garage';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.headerRight}>
          {tab === 'clientes' && isAdmin && <TouchableOpacity onPress={() => setShowAddModal(true)}><Text style={styles.addBtn}>+</Text></TouchableOpacity>}
          <TouchableOpacity onPress={handleLogout}><Text style={styles.logout}>Salir</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabs}>
        {isAdmin && <TouchableOpacity style={[styles.tab, tab === 'clientes' && styles.tabActive]} onPress={() => setTab('clientes')}><Text style={[styles.tabText, tab === 'clientes' && styles.tabTextActive]}>Clientes</Text></TouchableOpacity>}
        <TouchableOpacity style={[styles.tab, tab === 'citas' && styles.tabActive]} onPress={() => setTab('citas')}><Text style={[styles.tabText, tab === 'citas' && styles.tabTextActive]}>Citas</Text></TouchableOpacity>
        {(isMecanico || isAdmin) && <TouchableOpacity style={[styles.tab, tab === 'trabajos' && styles.tabActive]} onPress={() => setTab('trabajos')}><Text style={[styles.tabText, tab === 'trabajos' && styles.tabTextActive]}>Trabajos</Text></TouchableOpacity>}
      </View>
      {tab === 'clientes' && isAdmin ? detalleMode ? renderDetalleCliente() : (
        <FlatList data={usuarios.filter(u => u.rol === 'cliente')} keyExtractor={i => i.id.toString()} renderItem={renderCliente} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />} ListEmptyComponent={<Text style={styles.empty}>No hay clientes</Text>} />
      ) : tab === 'citas' ? (
        <FlatList data={citas} keyExtractor={i => i.id.toString()} renderItem={renderCita} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />} ListEmptyComponent={<Text style={styles.empty}>No hay citas</Text>} />
      ) : (
        <FlatList data={trabajos} keyExtractor={i => i.id.toString()} renderItem={renderTrabajo} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />} ListEmptyComponent={<Text style={styles.empty}>No hay trabajos</Text>} />
      )}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuevo Cliente</Text>
            <TextInput style={styles.modalInput} placeholder="Nombre" value={newClient.nombre} onChangeText={t => setNewClient({...newClient, nombre: t})} />
            <TextInput style={styles.modalInput} placeholder="Email" value={newClient.email} onChangeText={t => setNewClient({...newClient, email: t})} keyboardType="email-address" />
            <TextInput style={styles.modalInput} placeholder="Móvil" value={newClient.movil} onChangeText={t => setNewClient({...newClient, movil: t})} keyboardType="phone-pad" />
            <TextInput style={styles.modalInput} placeholder="Contraseña" value={newClient.contrasena} onChangeText={t => setNewClient({...newClient, contrasena: t})} secureTextEntry />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleAddClient}><Text style={styles.modalBtnText}>Crear</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddModal(false)}><Text style={styles.modalBtnTextCancel}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#e94560', fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  addBtn: { color: '#10b981', fontSize: 24, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e94560' },
  tabText: { color: '#888', fontSize: 16 },
  tabTextActive: { color: '#e94560', fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: '#16213e', padding: 16, borderRadius: 12, marginBottom: 12 },
  matricula: { fontSize: 18, fontWeight: 'bold', color: '#0ab1e6', marginBottom: 4 },
  info: { color: '#888', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  citaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  precio: { color: '#10b981', fontSize: 18, fontWeight: 'bold' },
  clienteCard: { backgroundColor: '#16213e', padding: 16, marginBottom: 12, borderRadius: 12 },
  clienteNombre: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  clienteEmail: { color: '#888', fontSize: 14 },
  clienteMovil: { color: '#666', fontSize: 12 },
  detalleView: { flex: 1, backgroundColor: '#1a1a2e' },
  backBtn: { padding: 20, paddingTop: 10 },
  backText: { color: '#e94560', fontSize: 16 },
  detalleHeader: { padding: 20, paddingTop: 0 },
  detalleNombre: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  detalleEmail: { color: '#888', fontSize: 16, marginBottom: 4 },
  detalleMovil: { color: '#666', fontSize: 14 },
  detalleSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#e94560', marginTop: 30, paddingHorizontal: 20, marginBottom: 15 },
  detalleCoche: { backgroundColor: '#16213e', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 12 },
  detalleMatricula: { fontSize: 18, fontWeight: 'bold', color: '#0ab1e6', marginBottom: 4 },
  detalleModelo: { color: '#ccc', fontSize: 15 },
  detalleAno: { color: '#666', fontSize: 13 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#16213e', padding: 24, borderRadius: 16, width: '85%', maxWidth: 350 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#1a1a2e', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, backgroundColor: '#e94560', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#333' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: '#ccc', fontSize: 16 }
});