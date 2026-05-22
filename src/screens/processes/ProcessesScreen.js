import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { getProcesses, deleteProcess } from '../../services/processService';
import { formatarDataBR } from '../../utils/dateUtils';
import { cancelDeadlineNotifications } from '../../services/notificationService';

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

function diferencaDias(dataISO) {
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  const data = new Date(`${dataISO}T00:00:00`);

  return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
}

function getStatusInfo(dataFinal) {
  const dias = diferencaDias(dataFinal);

  if (dias < 0) {
    return {
      label: 'Vencido',
      description: `Venceu há ${Math.abs(dias)} dia(s)`,
      color: '#DC2626',
      backgroundColor: '#FEF2F2',
      borderColor: '#DC2626',
      icon: 'alert-triangle',
    };
  }

  if (dias === 0) {
    return {
      label: 'Hoje',
      description: 'Vence hoje',
      color: '#F97316',
      backgroundColor: '#FFF7ED',
      borderColor: '#F97316',
      icon: 'calendar',
    };
  }

  return {
    label: 'A vencer',
    description: `Faltam ${dias} dia(s)`,
    color: '#16A34A',
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
    icon: 'folder',
  };
}

export default function ProcessesScreen({ navigation }) {
  const { user } = useAuth();

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredProcesses = useMemo(() => {
    const termo = search.toLowerCase().trim();

    if (!termo) {
      return processes;
    }

    return processes.filter((item) => {
      return (
        item.numero_processo?.toLowerCase().includes(termo) ||
        item.parte?.toLowerCase().includes(termo) ||
        item.tipo_acao?.toLowerCase().includes(termo)
      );
    });
  }, [processes, search]);

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

  function renderProcess({ item }) {
    const status = getStatusInfo(item.data_final);
    const lembretesAtivos =
      Array.isArray(item.notification_ids) && item.notification_ids.length > 0;

    return (
      <View style={[styles.card, { borderLeftColor: status.borderColor }]}>
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: status.backgroundColor },
            ]}
          >
            <Feather name={status.icon} size={26} color={status.color} />
          </View>

          <View style={styles.info}>
            <Text style={styles.processNumber} numberOfLines={1}>
              {item.numero_processo}
            </Text>

            <Text style={styles.party} numberOfLines={1}>
              {item.parte}
            </Text>

            <Text style={styles.actionType} numberOfLines={1}>
              {item.tipo_acao || 'Tipo de ação não informado'}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color="#64748B" />
                <Text style={styles.metaText}>
                  {formatarDataBR(item.data_final)}
                </Text>
              </View>

              <Text style={styles.metaSeparator}>|</Text>

              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color="#64748B" />
                <Text style={styles.metaText}>
                  {item.tipo_contagem === 'uteis'
                    ? 'Dias úteis'
                    : 'Dias corridos'}
                </Text>
              </View>
            </View>

            <View style={styles.reminderRow}>
              <Feather
                name={lembretesAtivos ? 'bell' : 'bell-off'}
                size={14}
                color={lembretesAtivos ? '#16A34A' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.reminderText,
                  { color: lembretesAtivos ? '#16A34A' : '#94A3B8' },
                ]}
              >
                {lembretesAtivos ? 'Lembretes ativos' : 'Lembretes não ativos'}
              </Text>
            </View>
          </View>

          <View style={styles.statusArea}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>

            <Text style={[styles.statusDescription, { color: status.color }]}>
              {status.description}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('ProcessForm', { process: item })
            }
          >
            <Feather name="edit-2" size={18} color="#1D4ED8" />
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Feather name="trash-2" size={18} color="#DC2626" />
            <Text style={styles.deleteText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Carregando processos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Processos</Text>
          <Text style={styles.subtitle}>Gerencie seus processos cadastrados.</Text>
        </View>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('ProcessForm')}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.newButtonText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar processo, parte ou ação..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filteredProcesses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="folder" size={42} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Nenhum processo encontrado</Text>
          <Text style={styles.emptyText}>
            Cadastre um novo processo ou ajuste sua busca.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProcesses}
          keyExtractor={(item) => item.id}
          renderItem={renderProcess}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  newButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#0F172A',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  processNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  party: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  actionType: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 5,
    color: '#64748B',
    fontWeight: '600',
    fontSize: 12,
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: '#CBD5E1',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  statusArea: {
    alignItems: 'flex-end',
    maxWidth: 105,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusDescription: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});