import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Feather,
  MaterialIcons,
  Ionicons,
} from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { getProcesses } from '../../services/processService';
import { formatarDataBR } from '../../utils/dateUtils';

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

function diferencaDias(dataISO) {
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  const data = new Date(`${dataISO}T00:00:00`);
  return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
}

function getStatus(dias) {
  if (dias < 0) {
    return {
      label: `Vencido há ${Math.abs(dias)} dia(s)`,
      bg: '#FEE2E2',
      color: '#DC2626',
    };
  }

  if (dias === 0) {
    return {
      label: 'Vence hoje',
      bg: '#FFF7ED',
      color: '#F97316',
    };
  }

  if (dias === 1) {
    return {
      label: 'Vence amanhã',
      bg: '#FFF7ED',
      color: '#F97316',
    };
  }

  return {
    label: `Faltam ${dias} dias`,
    bg: '#EFF6FF',
    color: '#2563EB',
  };
}

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  number,
  label,
  numberColor,
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconCircle, { backgroundColor: iconBg }]}>
        {icon}
      </View>

      <View style={styles.summaryContent}>
        <Text style={[styles.summaryNumber, { color: numberColor }]}>
          {number}
        </Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();

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
      console.error('Erro ao carregar dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProcesses();
    }, [loadProcesses])
  );

  const total = processes.length;

  const vencendoHoje = processes.filter(
    (item) => diferencaDias(item.data_final) === 0
  ).length;

  const vencidos = processes.filter(
    (item) => diferencaDias(item.data_final) < 0
  ).length;

  const proximos7Dias = processes.filter((item) => {
    const dias = diferencaDias(item.data_final);
    return dias >= 0 && dias <= 7;
  }).length;

  const urgentes = [...processes]
    .sort((a, b) => new Date(a.data_final) - new Date(b.data_final))
    .slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F2A44" />
        <Text style={styles.loadingText}>Carregando painel...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Cabeçalho */}
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>Painel de Prazos</Text>
        <Text style={styles.headerSubtitle}>
          Visão geral dos prazos processuais cadastrados.
        </Text>
      </View>

      {/* Cards de resumo */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          icon={
            <Feather name="folder" size={28} color="#2563EB" />
          }
          iconBg="#EFF6FF"
          number={total}
          label="Processos"
          numberColor="#0F2A44"
        />

        <SummaryCard
          icon={
            <Feather name="calendar" size={28} color="#F97316" />
          }
          iconBg="#FFF7ED"
          number={vencendoHoje}
          label="Vencem hoje"
          numberColor="#F97316"
        />

        <SummaryCard
          icon={
            <Feather name="calendar" size={28} color="#059669" />
          }
          iconBg="#ECFDF5"
          number={proximos7Dias}
          label="Próximos 7 dias"
          numberColor="#059669"
        />

        <SummaryCard
          icon={
            <MaterialIcons
              name="warning-amber"
              size={30}
              color="#DC2626"
            />
          }
          iconBg="#FEF2F2"
          number={vencidos}
          label="Vencidos"
          numberColor="#DC2626"
        />
      </View>

      {/* Título da seção */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIcon}>
            <Feather
              name="clock"
              size={22}
              color="#0F2A44"
            />
          </View>

          <View>
            <Text style={styles.sectionTitle}>
              Prazos mais urgentes
            </Text>
            <Text style={styles.sectionDescription}>
              Ordenados pela data final mais próxima.
            </Text>
          </View>
        </View>
      </View>

      {/* Lista */}
      {urgentes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            Nenhum prazo cadastrado
          </Text>
          <Text style={styles.emptyText}>
            Cadastre um processo para acompanhar os vencimentos.
          </Text>
        </View>
      ) : (
        urgentes.map((item) => {
          const dias = diferencaDias(item.data_final);
          const status = getStatus(dias);

          return (
            <View key={item.id} style={styles.deadlineCard}>
              {/* Ícone */}
              <View style={styles.deadlineIcon}>
                <Feather
                  name="calendar"
                  size={24}
                  color="#2563EB"
                />
              </View>

              {/* Informações */}
              <View style={styles.deadlineInfo}>
                <Text
                  style={styles.processNumber}
                  numberOfLines={1}
                >
                  {item.numero_processo}
                </Text>

                <Text
                  style={styles.processParty}
                  numberOfLines={1}
                >
                  {item.parte}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Feather
                      name="calendar"
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.metaText}>
                      {formatarDataBR(item.data_final)}
                    </Text>
                  </View>

                  <Text style={styles.metaSeparator}>|</Text>

                  <Text style={styles.metaText}>
                    {item.tipo_contagem === 'uteis'
                      ? 'Dias úteis'
                      : 'Dias corridos'}
                  </Text>
                </View>
              </View>

              {/* Status */}
              <View style={styles.rightColumn}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: status.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: status.color },
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#94A3B8"
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          );
        })
      )}

      {/* Botão sair */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={signOut}
      >
        <Feather
          name="log-out"
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  logo: {
    width: 220,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },

  headerBlock: {
    marginBottom: 24,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F2A44',
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  summaryCard: {
    width: '49%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  summaryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  summaryContent: {
    flex: 1,
  },

  summaryNumber: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 2,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flexShrink:1,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#0F2A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2A44',
  },

  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  deadlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  deadlineIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  deadlineInfo: {
    flex: 1,
  },

  processNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F2A44',
    marginBottom: 4,
  },

  processParty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 5,
    fontWeight: '600',
  },

  metaSeparator: {
    marginHorizontal: 8,
    color: '#CBD5E1',
    fontWeight: '700',
  },

  rightColumn: {
    alignItems: 'center',
    marginLeft: 8,
  },

  statusBadge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: '#0F2A44',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
});