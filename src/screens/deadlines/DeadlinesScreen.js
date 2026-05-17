import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeadlinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prazos</Text>
      <Text style={styles.subtitle}>Controle de prazos processuais</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
  },
});