import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

interface Coche {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
}

export const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [coches, setCoches] = useState<Coche[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.coches.list();
      if (Array.isArray(res)) {
        setCoches(res);
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

  const renderCoche = ({ item }: { item: Coche }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.matricula}>{item.matricula}</Text>
      <Text style={styles.info}>{item.marca} {item.modelo}</Text>
      <Text style={styles.info}>{item.anio} · {item.kilometraje?.toLocaleString()} km</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Garage</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={coches}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCoche}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No tienes vehículos</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#e94560', fontSize: 14 },
  list: { padding: 20 },
  card: { backgroundColor: '#16213e', padding: 16, borderRadius: 12, marginBottom: 12 },
  matricula: { fontSize: 18, fontWeight: 'bold', color: '#0ab1e6', marginBottom: 4 },
  info: { color: '#888', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 }
});