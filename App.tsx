import React from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fonts } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { Navigator } from './src/Navigator';

function Root() {
  const { ready } = useStore();
  const [loaded] = useFonts(fonts);
  if (!ready || !loaded) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  return <Navigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
