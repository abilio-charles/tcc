import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {
  Calendar,
  LocaleConfig,
} from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { getProcesses } from '../../services/processService';
import { formatarDataBR } from '../../utils/dateUtils';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ],
  dayNames: [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ],
  dayNamesShort: [
    'DOM',
    'SEG',
    'TER',
    'QUA',
    'QUI',
    'SEX',
    'SÁB',
  ],
  today: 'Hoje',
};

LocaleConfig.defaultLocale = 'pt-br';

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

function diferencaDias(dataISO) {
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  const data = new Date(`${dataISO}T00:00:00`);

  return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
}

export default function DeadlinesScreen() {
  const { user } = useAuth();

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(hojeISO());

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
      console.error('Erro ao carregar prazos:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProcesses();
    }, [loadProcesses])
  );

  const markedDates = useMemo(() => {
    const marks = {};

    processes.forEach((item) => {
      const dias = diferencaDias(item.data_final);

      let color = '#2563EB';

      if (dias < 0) {
        color = '#DC2626';
      } else if (dias === 0) {
        color = '#F97316';
      } else {
        color = '#16A34A';
      }

      marks[item.data_final] = {
        customStyles: {
          container: {
            borderBottomWidth: 4,
            borderBottomColor: color,
            borderRadius: 8,
          },
          text: {
            color: '#0F172A',
            fontWeight: '800',
          },
        },
      };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: '#1D4ED8',
      selectedTextColor: '#FFFFFF',
      customStyles: {
        ...(marks[selectedDate]?.customStyles || {}),
        container: {
          ...(marks[selectedDate]?.customStyles?.container || {}),
          backgroundColor: '#1D4ED8',
          borderRadius: 10,
        },
        text: {
          color: '#FFFFFF',
          fontWeight: '900',
        },
      },
    };

    return marks;
  }, [processes, selectedDate]);

  const selectedProcesses = processes.filter(
    (item) => item.data_final === selectedDate
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Carregando calendário...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Prazos</Text>

      <View style={styles.calendarContainer}>
        <Calendar
          markingType="custom"
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            todayTextColor: '#1D4ED8',
            selectedDayBackgroundColor: '#1D4ED8',
            arrowColor: '#1D4ED8',
            monthTextColor: '#0F172A',
            textMonthFontWeight: '900',
            textDayFontWeight: '600',
            textDayHeaderFontWeight: '700',
          }}
        />

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { backgroundColor: '#16A34A' },
              ]}
            />
            <Text style={styles.legendText}>A vencer</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { backgroundColor: '#F97316' },
              ]}
            />
            <Text style={styles.legendText}>Hoje</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { backgroundColor: '#DC2626' },
              ]}
            />
            <Text style={styles.legendText}>Vencido</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Prazos em {formatarDataBR(selectedDate)}
        </Text>

        <Text style={styles.badge}>
          {selectedProcesses.length} prazo(s)
        </Text>
      </View>

      {selectedProcesses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhum prazo nesta data.</Text>
        </View>
      ) : (
        selectedProcesses.map((item) => {
          const dias = diferencaDias(item.data_final);

          let status = 'A vencer';
          let color = '#16A34A';
          let backgroundColor = '#ECFDF5';

          if (dias < 0) {
            status = 'Vencido';
            color = '#DC2626';
            backgroundColor = '#FEF2F2';
          } else if (dias === 0) {
            status = 'Hoje';
            color = '#F97316';
            backgroundColor = '#FFF7ED';
          }

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <Feather
                    name="calendar"
                    size={22}
                    color="#1D4ED8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.processNumber}>
                    {item.numero_processo}
                  </Text>

                  <Text style={styles.processParty}>{item.parte}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {formatarDataBR(item.data_final)}
                    </Text>

                    <Text style={styles.separator}>|</Text>

                    <Text style={styles.metaText}>
                      {item.tipo_contagem === 'uteis'
                        ? 'Dias úteis'
                        : 'Dias corridos'}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
  },

  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    marginBottom: 24,

    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendLine: {
    width: 22,
    height: 5,
    borderRadius: 999,
    marginRight: 6,
  },

  legendText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },

  badge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
    overflow: 'hidden',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  processNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },

  processParty: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  separator: {
    marginHorizontal: 8,
    color: '#CBD5E1',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 12,
  },

  statusText: {
    fontWeight: '900',
    fontSize: 12,
  },
});