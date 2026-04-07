import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
