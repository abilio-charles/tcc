import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { createProcess, updateProcess } from '../../services/processService';

import {
  scheduleDeadlineNotifications,
  cancelDeadlineNotifications,
} from '../../services/notificationService';

import {
  calcularPrazo,
  formatarDataBR,
} from '../../utils/dateUtils';

function formatarDataParaBR(date) {
  return date.toLocaleDateString('pt-BR');
}

function converterDateParaISO(date) {
  return date.toISOString().split('T')[0];
}

export default function ProcessFormScreen({ navigation, route }) {
  const { user } = useAuth();

  const process = route.params?.process;
  const isEditing = !!process;

  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [parte, setParte] = useState('');
  const [tipoAcao, setTipoAcao] = useState('');
  const [dataIntimacao, setDataIntimacao] = useState(new Date());
  const [prazoDias, setPrazoDias] = useState('');
  const [tipoContagem, setTipoContagem] = useState('uteis');
  const [incluirPrimeiroDia, setIncluirPrimeiroDia] = useState(false);
  const [prorrogarSeNaoUtil, setProrrogarSeNaoUtil] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process) {
      setNumeroProcesso(process.numero_processo || '');
      setParte(process.parte || '');
      setTipoAcao(process.tipo_acao || '');

      if (process.data_intimacao) {
        setDataIntimacao(new Date(`${process.data_intimacao}T00:00:00`));
      }

      setPrazoDias(process.prazo_dias ? String(process.prazo_dias) : '');
      setTipoContagem(process.tipo_contagem || 'uteis');
      setIncluirPrimeiroDia(process.incluir_primeiro_dia || false);
      setProrrogarSeNaoUtil(process.prorrogar_se_nao_util ?? true);
    }
  }, [process]);

  const dataInicioBR = formatarDataParaBR(dataIntimacao);

  const dataFinalPreview =
    dataInicioBR && prazoDias
      ? calcularPrazo({
          dataInicioBR,
          prazoDias,
          incluirPrimeiroDia,
          tipoContagem,
          prorrogarSeNaoUtil,
        })
      : '';

  async function handleSave() {
    if (!numeroProcesso || !parte || !tipoAcao || !prazoDias) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }

    const dataFinal = calcularPrazo({
      dataInicioBR,
      prazoDias,
      incluirPrimeiroDia,
      tipoContagem,
      prorrogarSeNaoUtil,
    });

    if (!dataFinal) {
      Alert.alert('Erro', 'Não foi possível calcular a data final.');
      return;
    }

    const dataIntimacaoISO = converterDateParaISO(dataIntimacao);

    try {
      setLoading(true);

      if (isEditing && process.notification_ids?.length > 0) {
        await cancelDeadlineNotifications(process.notification_ids);
      }

      let notificationIds = [];

      if (Platform.OS !== 'web') {
        notificationIds = await scheduleDeadlineNotifications({
          processNumber: numeroProcesso,
          deadlineDateISO: dataFinal,
        });
      }

      const processData = {
        user_id: user.id,
        numero_processo: numeroProcesso,
        parte,
        tipo_acao: tipoAcao,
        data_intimacao: dataIntimacaoISO,
        prazo_dias: Number(prazoDias),
        data_final: dataFinal,
        incluir_primeiro_dia: incluirPrimeiroDia,
        tipo_contagem: tipoContagem,
        prorrogar_se_nao_util: prorrogarSeNaoUtil,
        notification_ids: notificationIds,
      };

      if (isEditing) {
        await updateProcess(process.id, processData);
      } else {
        await createProcess(processData);
      }

      Alert.alert(
        'Sucesso',
        isEditing
          ? 'Processo atualizado com sucesso.'
          : `Prazo calculado: ${formatarDataBR(dataFinal)}`
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        {isEditing ? 'Editar Processo' : 'Novo Processo'}
      </Text>

      <Text style={styles.subtitle}>
        Preencha as informações do processo judicial.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número do Processo</Text>
        <View style={styles.inputContainer}>
          <Feather name="file-text" size={20} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="0000000-00.0000.0.00.0000"
            placeholderTextColor="#94A3B8"
            value={numeroProcesso}
            onChangeText={setNumeroProcesso}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Parte</Text>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Nome da parte"
            placeholderTextColor="#94A3B8"
            value={parte}
            onChangeText={setParte}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Ação</Text>
        <View style={styles.inputContainer}>
          <Feather name="briefcase" size={20} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Ex: Trabalhista"
            placeholderTextColor="#94A3B8"
            value={tipoAcao}
            onChangeText={setTipoAcao}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Data Inicial do Prazo</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={20} color="#1D4ED8" />
          <Text style={styles.dateText}>{dataInicioBR}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dataIntimacao}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate) {
                setDataIntimacao(selectedDate);
              }
            }}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Prazo em Dias</Text>
        <View style={styles.inputContainer}>
          <Feather name="clock" size={20} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Ex: 15"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={prazoDias}
            onChangeText={(text) => setPrazoDias(text.replace(/[^0-9]/g, ''))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Incluir data inicial?</Text>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              incluirPrimeiroDia && styles.optionButtonActive,
            ]}
            onPress={() => setIncluirPrimeiroDia(true)}
          >
            <Text
              style={[
                styles.optionText,
                incluirPrimeiroDia && styles.optionTextActive,
              ]}
            >
              Sim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              !incluirPrimeiroDia && styles.optionButtonActive,
            ]}
            onPress={() => setIncluirPrimeiroDia(false)}
          >
            <Text
              style={[
                styles.optionText,
                !incluirPrimeiroDia && styles.optionTextActive,
              ]}
            >
              Não
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Contagem</Text>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              tipoContagem === 'uteis' && styles.optionButtonActive,
            ]}
            onPress={() => setTipoContagem('uteis')}
          >
            <Text
              style={[
                styles.optionText,
                tipoContagem === 'uteis' && styles.optionTextActive,
              ]}
            >
              Dias úteis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              tipoContagem === 'corridos' && styles.optionButtonActive,
            ]}
            onPress={() => setTipoContagem('corridos')}
          >
            <Text
              style={[
                styles.optionText,
                tipoContagem === 'corridos' && styles.optionTextActive,
              ]}
            >
              Dias corridos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tipoContagem === 'corridos' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Se o prazo fatal cair no sábado, domingo ou feriado, prorrogar?
          </Text>

          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                prorrogarSeNaoUtil && styles.optionButtonActive,
              ]}
              onPress={() => setProrrogarSeNaoUtil(true)}
            >
              <Text
                style={[
                  styles.optionText,
                  prorrogarSeNaoUtil && styles.optionTextActive,
                ]}
              >
                Sim
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                !prorrogarSeNaoUtil && styles.optionButtonActive,
              ]}
              onPress={() => setProrrogarSeNaoUtil(false)}
            >
              <Text
                style={[
                  styles.optionText,
                  !prorrogarSeNaoUtil && styles.optionTextActive,
                ]}
              >
                Não
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {dataFinalPreview ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Data final calculada</Text>
          <Text style={styles.previewDate}>
            {formatarDataBR(dataFinalPreview)}
          </Text>
        </View>
      ) : null}

      <View style={styles.notificationBox}>
        <Feather name="bell" size={22} color="#1D4ED8" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.notificationTitle}>Lembretes automáticos</Text>
          <Text style={styles.notificationText}>
            O aplicativo enviará notificações:
            {'\n'}• 2 dias antes
            {'\n'}• 1 dia antes
            {'\n'}• No dia do vencimento
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Atualizar Processo' : 'Salvar Processo'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    marginBottom: 28,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  optionText: {
    color: '#475569',
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  previewBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },
  previewLabel: {
    color: '#047857',
    fontWeight: '800',
    marginBottom: 6,
  },
  previewDate: {
    color: '#065F46',
    fontSize: 26,
    fontWeight: '900',
  },
  notificationBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 30,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1D4ED8',
    marginBottom: 6,
  },
  notificationText: {
    color: '#475569',
    lineHeight: 22,
    fontWeight: '600',
  },
  saveButton: {
    height: 60,
    backgroundColor: '#1D4ED8',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
  },
});