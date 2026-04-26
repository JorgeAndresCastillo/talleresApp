import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
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
  const [seleccionarMostrar, setSeleccionarMostrar] = useState<number | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'clientes' | 'citas' | 'trabajos'>('clientes');

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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    setToken(null);
    router.replace('/login');
  };

const selectCliente = (cliente: Usuario) => {
    setSelectedCliente(cliente);
  };

  const openClienteDetalle = (cliente: Usuario) => {
    setSelectedCliente(cliente);
    setDetalleMode(true);
  };

  const renderCliente = ({ item }: { item: Usuario }) => (
    <TouchableOpacity 
      style={styles.clienteCard}
      onPress={() => openClienteDetalle(item)}
    >
      <Text style={styles.clienteNombre}>{item.nombre}</Text>
      <Text style={styles.clienteEmail}>{item.email}</Text>
      <Text style={styles.clienteMovil}>📱 {item.movil}</Text>
    </TouchableOpacity>
  );

const renderDetalleCliente = () => {
    if (!selectedCliente || !detalleMode) return null;
    const clientCars = cochesTodos.filter(c => c.cliente_id === selectedCliente.id);
    return (
      <ScrollView style={styles.detalleView}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setDetalleMode(false)}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.detalleHeader}>
          <Text style={styles.detalleNombre}>{selectedCliente.nombre}</Text>
          <Text style={styles.detalleEmail}>{selectedCliente.email}</Text>
          <Text style={styles.detalleMovil}>📱 {selectedCliente.movil}</Text>
        </View>
        
        <Text style={styles.detalleSubtitle}>Vehículos ({clientCars.length})</Text>
        {clientCars.length > 0 ? (
          clientCars.map(coche => (
            <View key={coche.id} style={styles.detalleCoche}>
              <Text style={styles.detalleMatricula}>{coche.matricula}</Text>
              <Text style={styles.detalleModelo}>{coche.marca} {coche.modelo}</Text>
              <Text style={styles.detalleAno}>{coche.anio} · {coche.kilometraje?.toLocaleString()} km</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Sin vehículos</Text>
        )}
      </ScrollView>
    );
  };

  const renderCita = ({ item }: { item: Cita }) => {
    const estadoColor: Record<string, string> = {
      pendiente: '#f59e0b',
      aceptado: '#10b981',
      rechazado: '#ef4444',
      en_proceso: '#3b82f6',
      completada: '#6366f1'
    };
    return (
      <View style={styles.card}>
        <View style={styles.citaRow}>
          <Text style={styles.matricula}>{item.matricula}</Text>
          <View style={[styles.badge, { backgroundColor: estadoColor[item.estado] || '#64748b' }]}>
            <Text style={styles.badgeText}>{item.estado}</Text>
          </View>
        </View>
        <Text style={styles.info}>{item.fecha} a las {item.hora}</Text>
        <Text style={styles.info}>{item.descripcion}</Text>
      </View>
    );
  };

  const renderTrabajo = ({ item }: { item: Trabajo }) => {
    const estadoColor: Record<string, string> = {
      pendiente: '#f59e0b',
      en_proceso: '#3b82f6',
      completada: '#10b981'
    };
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.citaRow}>
          <Text style={styles.matricula}>{item.matricula}</Text>
          <Text style={styles.precio}>{item.precio}€</Text>
        </View>
        <Text style={styles.info}>{item.descripcion}</Text>
        <View style={[styles.badge, { backgroundColor: estadoColor[item.estado] || '#64748b', marginTop: 4 }]}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getTitle = () => {
    if (isAdmin) return 'Admin - Talleres Castillo';
    if (isMecanico) return 'Mecánico - Talleres Castillo';
    return 'Mi Garage';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {isAdmin && (
          <TouchableOpacity style={[styles.tab, tab === 'clientes' && styles.tabActive]} onPress={() => setTab('clientes')}>
            <Text style={[styles.tabText, tab === 'clientes' && styles.tabTextActive]}>Clientes</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.tab, tab === 'citas' && styles.tabActive]} onPress={() => setTab('citas')}>
          <Text style={[styles.tabText, tab === 'citas' && styles.tabTextActive]}>Citas</Text>
        </TouchableOpacity>
        {(isMecanico || isAdmin) && (
          <TouchableOpacity style={[styles.tab, tab === 'trabajos' && styles.tabActive]} onPress={() => setTab('trabajos')}>
            <Text style={[styles.tabText, tab === 'trabajos' && styles.tabTextActive]}>Trabajos</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'clientes' && isAdmin ? (
        detalleMode ? renderDetalleCliente() : (
          <FlatList
            data={usuarios.filter(u => u.rol === 'cliente')}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCliente}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
            ListEmptyComponent={<Text style={styles.empty}>No hay clientes</Text>}
          />
        )
      ) : tab === 'citas' ? (
        <FlatList
          data={citas}
          keyExtractor={item => item.id.toString()}
          renderItem={renderCita}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay citas</Text>}
        />
      ) : (
        <FlatList
          data={trabajos}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTrabajo}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay trabajos</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#e94560', fontSize: 14 },
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
  splitView: { flex: 1, flexDirection: 'row' },
  clienteList: { flex: 1, borderRightWidth: 1, borderRightColor: '#333' },
  clienteCard: { backgroundColor: '#16213e', padding: 16, marginBottom: 8, borderRadius: 8, marginHorizontal: 10 },
  clienteCardSelected: { borderLeftWidth: 3, borderLeftColor: '#e94560' },
  clienteNombre: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  clienteEmail: { color: '#888', fontSize: 13 },
  clienteMovil: { color: '#666', fontSize: 12 },
  subList: { padding: 20 },
  subtitle: { fontSize: 16, fontWeight: 'bold', color: '#e94560', marginBottom: 10, marginTop: 20 },
  cocheList: { flex: 1, padding: 10 },
  cocheCard: { backgroundColor: '#0f3460', padding: 12, borderRadius: 8, marginBottom: 8 },
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
  detalleAno: { color: '#666', fontSize: 13 }
});