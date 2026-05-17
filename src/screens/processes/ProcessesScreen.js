import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../hooks/useAuth';
import { getProcesses, deleteProcess } from '../../services/processService';
import { formatarDataBR } from '../../utils/dateUtils';
import { cancelDeadlineNotifications } from '../../services/notificationService';

export default function ProcessesScreen({ navigation }) {
  const { user } = useAuth();

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setProcesses([]);
        return;
      }

      const data = await getProcesses(user.id);
      setProcesses(data);
    } catch (error) {
      console.error('Erro ao carregar processos:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProcesses();
    }, [loadProcesses])
  );

  async function confirmDelete(processItem) {
    try {
      await cancelDeadlineNotifications(processItem.notification_ids || []);
      await deleteProcess(processItem.id);
      await loadProcesses();
    } catch (error) {
      Alert.alert('Erro ao excluir', error.message);
    }
  }

  function handleDelete(processItem) {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        'Tem certeza que deseja excluir este processo?'
      );

      if (confirmar) {
        confirmDelete(processItem);
      }

      return;
    }

    Alert.alert(
      'Excluir processo',
      'Tem certeza que deseja excluir este processo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => confirmDelete(processItem),
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (processes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Processos</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ProcessForm')}
        >
          <Text style={styles.buttonText}>Novo Processo</Text>
        </TouchableOpacity>

        <Text style={styles.emptyText}>Nenhum processo cadastrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Processos</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ProcessForm')}
      >
        <Text style={styles.buttonText}>Novo Processo</Text>
      </TouchableOpacity>

      <FlatList
        data={processes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.number}>{item.numero_processo}</Text>

            <Text>Parte: {item.parte}</Text>
            <Text>Tipo de ação: {item.tipo_acao || 'Não informado'}</Text>
            <Text>Data inicial: {formatarDataBR(item.data_intimacao)}</Text>
            <Text>Prazo: {item.prazo_dias} dias</Text>
            <Text>Data final: {formatarDataBR(item.data_final)}</Text>
            <Text>
              Contagem:{' '}
              {item.tipo_contagem === 'uteis'
                ? 'Dias úteis'
                : 'Dias corridos'}
            </Text>
            <Text>
              Lembretes:{' '}
              {Array.isArray(item.notification_ids) &&
              item.notification_ids.length > 0
                ? 'Ativos'
                : 'Não ativos'}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('ProcessForm', { process: item })
                }
              >
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1d4ed8',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 180,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  number: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#0f172a',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});