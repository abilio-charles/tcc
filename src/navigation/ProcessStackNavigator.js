import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProcessesScreen from '../screens/processes/ProcessesScreen';
import ProcessFormScreen from '../screens/processes/ProcessFormScreen';

const Stack = createNativeStackNavigator();

export default function ProcessStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProcessesList"
        component={ProcessesScreen}
        options={{ title: 'Processos' }}
      />

      <Stack.Screen
        name="ProcessForm"
        component={ProcessFormScreen}
        options={{ title: 'Novo Processo' }}
      />
    </Stack.Navigator>
  );
}