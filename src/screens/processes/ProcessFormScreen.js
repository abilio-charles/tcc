import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { createProcess, updateProcess } from '../../services/processService';

import {
  calcularPrazo,
  converterDataBRParaISO,
  formatarCampoData,
  formatarDataBR,
} from '../../utils/dateUtils';

import {
  scheduleDeadlineNotifications,
  cancelDeadlineNotifications,
} from '../../services/notificationService';

export default function ProcessFormScreen({ navigation, route }) {
  const { user } = useAuth();

  const processToEdit = route.params?.process;
  const isEditing = !!processToEdit;

  const [numeroProcesso, setNumeroProcesso] = useState(
    processToEdit?.numero_processo || ''
  );
  const [parte, setParte] = useState(processToEdit?.parte || '');
  const [tipoAcao, setTipoAcao] = useState(processToEdit?.tipo_acao || '');
  const [dataInicio, setDataInicio] = useState(
    processToEdit?.data_intimacao
      ? formatarDataBR(processToEdit.data_intimacao)
      : ''
  );
  const [prazoDias, setPrazoDias] = useState(
    processToEdit?.prazo_dias ? String(processToEdit.prazo_dias) : ''
  );
  const [incluirPrimeiroDia, setIncluirPrimeiroDia] = useState(
    processToEdit?.incluir_primeiro_dia || false
  );
  const [tipoContagem, setTipoContagem] = useState(
    processToEdit?.tipo_contagem || 'uteis'
  );
  const [prorrogarSeNaoUtil, setProrrogarSeNaoUtil] = useState(
    processToEdit?.prorrogar_se_nao_util ?? true
  );
  const [loading, setLoading] = useState(false);

  const dataFinalPreview =
    dataInicio && prazoDias
      ? calcularPrazo({
          dataInicioBR: dataInicio,
          prazoDias,
          incluirPrimeiroDia,
          tipoContagem,
          prorrogarSeNaoUtil,
        })
      : '';

  async function handleSave() {
    if (!numeroProcesso || !parte || !dataInicio || !prazoDias) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
      return;
    }

    const dataFinal = calcularPrazo({
      dataInicioBR: dataInicio,
      prazoDias,
      incluirPrimeiroDia,
      tipoContagem,
      prorrogarSeNaoUtil,
    });

    if (!dataFinal) {
      Alert.alert(
        'Data inválida',
        'Informe a data no formato DD/MM/AAAA. Exemplo: 14/05/2026.'
      );
      return;
    }

    const dataInicioBanco = converterDataBRParaISO(dataInicio);

    try {
      setLoading(true);

      if (isEditing) {
        await cancelDeadlineNotifications(processToEdit.notification_ids || []);
      }

      const notificationIds = await scheduleDeadlineNotifications({
        processNumber: numeroProcesso,
        deadlineDateISO: dataFinal,
      });

      const processData = {
        user_id: user.id,
        numero_processo: numeroProcesso,
        parte,
        tipo_acao: tipoAcao,
        data_intimacao: dataInicioBanco,
        prazo_dias: Number(prazoDias),
        data_final: dataFinal,
        incluir_primeiro_dia: incluirPrimeiroDia,
        tipo_contagem: tipoContagem,
        prorrogar_se_nao_util: prorrogarSeNaoUtil,
        notification_ids: notificationIds,
      };

      if (isEditing) {
        await updateProcess(processToEdit.id, processData);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Editar Processo' : 'Cadastrar Processo'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Número do processo"
        placeholderTextColor="rgba(0,0,0,0.35)"
        value={numeroProcesso}
        onChangeText={setNumeroProcesso}
      />

      <TextInput
        style={styles.input}
        placeholder="Parte / Cliente"
        placeholderTextColor="rgba(0,0,0,0.35)"
        value={parte}
        onChangeText={setParte}
      />

      <TextInput
        style={styles.input}
        placeholder="Tipo de ação"
        placeholderTextColor="rgba(0,0,0,0.35)"
        value={tipoAcao}
        onChangeText={setTipoAcao}
      />

      <TextInput
        style={styles.input}
        placeholder="Data inicial (DD/MM/AAAA)"
        placeholderTextColor="rgba(0,0,0,0.35)"
        value={dataInicio}
        onChangeText={(text) => setDataInicio(formatarCampoData(text))}
        keyboardType="numeric"
        maxLength={10}
      />

      <TextInput
        style={styles.input}
        placeholder="Prazo em dias"
        placeholderTextColor="rgba(0,0,0,0.35)"
        value={prazoDias}
        onChangeText={(text) => setPrazoDias(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Incluir o primeiro dia?</Text>

      <View style={styles.optionRow}>
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

      <Text style={styles.sectionTitle}>Tipo de contagem</Text>

      <View style={styles.optionRow}>
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

      {tipoContagem === 'corridos' && (
        <>
          <Text style={styles.sectionTitle}>
            Se o prazo fatal cair no sábado, domingo ou feriado, prorrogar?
          </Text>

          <View style={styles.optionRow}>
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
        </>
      )}

      {dataFinalPreview ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Data final calculada:</Text>
          <Text style={styles.previewDate}>
            {formatarDataBR(dataFinalPreview)}
          </Text>
          <Text style={styles.previewInfo}>
            Tipo: {tipoContagem === 'uteis' ? 'dias úteis' : 'dias corridos'}
          </Text>
          <Text style={styles.previewInfo}>
            Lembretes: 2 dias antes, 1 dia antes e no dia do vencimento
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? 'Atualizar processo' : 'Salvar processo'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 10,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  optionButton: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  optionText: {
    color: '#334155',
    fontWeight: 'bold',
  },
  optionTextActive: {
    color: '#fff',
  },
  previewBox: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  previewLabel: {
    color: '#0369a1',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075985',
  },
  previewInfo: {
    marginTop: 4,
    color: '#0369a1',
  },
  button: {
    backgroundColor: '#1d4ed8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});