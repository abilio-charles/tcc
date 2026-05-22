import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha todos os campos.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Senha inválida',
        'A senha deve possuir pelo menos 6 caracteres.'
      );
      return;
    }

    try {
      setLoading(true);

      await signUp(email, password, name);

      Alert.alert(
        'Conta criada',
        'Sua conta foi criada com sucesso.'
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Erro ao criar conta',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>

          <Text style={styles.subtitle}>
            Cadastre-se para gerenciar seus prazos processuais.
          </Text>

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>

            <View style={styles.inputContainer}>
              <Feather
                name="user"
                size={20}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>

            <View style={styles.inputContainer}>
              <Feather
                name="mail"
                size={20}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>

            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={20}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Botão */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather
                  name="user-plus"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                  Criar conta
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Voltar login */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>
              Já possui conta?{' '}
              <Text style={styles.linkStrong}>
                Entrar
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  logo: {
    width: 220,
    height: 130,
    alignSelf: 'center',
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '600',
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },

  inputContainer: {
    height: 58,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0F172A',
  },

  button: {
    height: 58,
    backgroundColor: '#1D4ED8',
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',

    marginTop: 8,

    shadowColor: '#1D4ED8',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
  },

  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },

  linkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  linkStrong: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
});