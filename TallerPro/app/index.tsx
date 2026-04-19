import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api, setToken } from '../src/api';

interface Coche {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
}

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  descripcion: string;
  matricula: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [coches, setCoches] = useState<Coche[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'garage' | 'citas'>('garage');

  const loadData = async () => {
    try {
      const [cochesRes, citasRes] = await Promise.all([
        api.coches.list(),
        api.citas.list()
      ]);
      if (Array.isArray(cochesRes)) setCoches(cochesRes);
      if (Array.isArray(citasRes)) setCitas(citasRes);
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

  const handleLogout = async () => {
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/modal');
  };

  const renderCoche = ({ item }: { item: Coche }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.matricula}>{item.matricula}</Text>
      <Text style={styles.info}>{item.marca} {item.modelo}</Text>
      <Text style={styles.info}>{item.anio} · {item.kilometraje?.toLocaleString()} km</Text>
    </TouchableOpacity>
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Talleres Castillo</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'garage' && styles.tabActive]} onPress={() => setTab('garage')}>
          <Text style={[styles.tabText, tab === 'garage' && styles.tabTextActive]}>Mi Garage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'citas' && styles.tabActive]} onPress={() => setTab('citas')}>
          <Text style={[styles.tabText, tab === 'citas' && styles.tabTextActive]}>Citas</Text>
        </TouchableOpacity>
      </View>

      {tab === 'garage' ? (
        <FlatList
          data={coches}
          keyExtractor={item => item.id.toString()}
          renderItem={renderCoche}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No tienes vehículos</Text>}
        />
      ) : (
        <FlatList
          data={citas}
          keyExtractor={item => item.id.toString()}
          renderItem={renderCita}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No tienes citas</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
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
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }
});