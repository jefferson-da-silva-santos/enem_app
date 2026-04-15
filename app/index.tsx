// app/index.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

export default function Index() {
  const { isLoading, isFirstAccess, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isFirstAccess) {
      router.replace('/(auth)/create-pin');
    } else if (!isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/lock');
    }
  }, [isLoading, isFirstAccess, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bg }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}