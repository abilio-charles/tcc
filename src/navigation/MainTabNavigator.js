import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import ProcessStackNavigator from './ProcessStackNavigator';
import DeadlinesScreen from '../screens/deadlines/DeadlinesScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      // Permite trocar de aba arrastando o dedo para os lados
      screenOptions={({ route }) => ({
        headerShown: false,

        // Ativa o gesto de swipe entre as abas
        swipeEnabled: true,

        // Cor da aba selecionada
        tabBarActiveTintColor: '#1D4ED8',

        // Cor das abas não selecionadas
        tabBarInactiveTintColor: '#94A3B8',

        // Estilo da barra inferior
        tabBarStyle: {
          height: 85,
          paddingTop: 10,
          paddingBottom: 18,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
      },

        // Estilo do texto
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        // Ícones monocromáticos
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Início') {
            iconName = 'home-outline';
          } else if (route.name === 'Processos') {
            iconName = 'folder-outline';
          } else if (route.name === 'Prazos') {
            iconName = 'calendar-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size || 24}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Processos"
        component={ProcessStackNavigator}
      />

      <Tab.Screen
        name="Prazos"
        component={DeadlinesScreen}
      />
    </Tab.Navigator>
  );
}