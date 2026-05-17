import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import ProcessStackNavigator from './ProcessStackNavigator';
import DeadlinesScreen from '../screens/deadlines/DeadlinesScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />

      <Tab.Screen
        name="Processes"
        component={ProcessStackNavigator}
        options={{ title: 'Processos', headerShown: false }}
      />

      <Tab.Screen
        name="Deadlines"
        component={DeadlinesScreen}
        options={{ title: 'Prazos' }}
      />
    </Tab.Navigator>
  );
}