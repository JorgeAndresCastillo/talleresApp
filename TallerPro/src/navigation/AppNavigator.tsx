import React from 'react';
import { NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationIndependentTree>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.rol === 'admin' || user.rol === 'mecanico' ? (
          <Stack.Screen name="AdminDashboard" component={DashboardScreen} />
        ) : (
          <Stack.Screen name="ClientDashboard" component={DashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationIndependentTree>
  );
};