import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>WELCOME</Text>
          <Text style={styles.backText}>BACK</Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Select your role</Text>
          <View style={styles.roleGrid}>
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'admin' && styles.roleCardActive]}
              onPress={() => setSelectedRole('admin')}
            >
              <Text style={[styles.roleText, selectedRole === 'admin' && styles.roleTextActive]}>Program Chair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'staff' && styles.roleCardActive]}
              onPress={() => setSelectedRole('staff')}
            >
              <Text style={[styles.roleText, selectedRole === 'staff' && styles.roleTextActive]}>Staff</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  welcomeText: { fontSize: 48, fontWeight: '900', color: '#000' },
  backText: { fontSize: 48, fontWeight: '900', color: '#EAB308' },
  underline: { width: 60, height: 4, backgroundColor: '#EAB308', marginTop: 10 },
  formContainer: { width: '100%' },
  label: { fontSize: 14, color: '#666', marginBottom: 12 },
  roleGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  roleCardActive: { borderColor: '#EAB308', backgroundColor: '#FEFCE8' },
  roleText: { fontSize: 12, fontWeight: '600', color: '#666' },
  roleTextActive: { color: '#000' },
  input: { height: 56, backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  loginButton: { backgroundColor: '#EAB308', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loginButtonText: { fontSize: 16, fontWeight: '700', color: '#000' }
});

export default LoginScreen;
