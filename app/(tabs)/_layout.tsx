// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography } from '../../constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{icon}</Text>
      <Text style={{
        fontSize: 10,
        color: focused ? Colors.primary : '#8A9ABB',
        fontWeight: focused ? '700' : '400',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Início" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="questoes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📝" label="Questões" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="foco"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: Colors.primary,
              width: 52,
              height: 52,
              borderRadius: 26,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <Text style={{ fontSize: 22 }}>⏱️</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="desempenho"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Stats" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="Mais" focused={focused} />,
        }}
      />
    </Tabs>
  );
}