import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { useApp } from '../../store/AppContext';
import { Colors } from '../../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


export default function TabLayout() {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? '#171717' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#262626' : '#e2e8f0',
          height: Platform.OS === 'ios' ? 94 : 74,
          paddingBottom: Platform.OS === 'ios' ? 34 : 18,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View className={`w-8 h-8 items-center justify-center rounded-xl ${focused ? (isDark ? 'bg-[#c0c1ff]/15' : 'bg-indigo-50') : ''}`}>
              <Text className="text-base"><FontAwesome name="home" size={24} color={focused ?colors.text:colors.textMuted}/></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ focused }) => (
            <View className={`w-8 h-8 items-center justify-center rounded-xl ${focused ? (isDark ? 'bg-[#c0c1ff]/15' : 'bg-indigo-50') : ''}`}>
              <Text className="text-base"><FontAwesome name="user" size={24} color={focused ?colors.text:colors.textMuted}/></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Suppliers',
          tabBarIcon: ({ focused }) => (
            <View className={`w-8 h-8 items-center justify-center rounded-xl ${focused ? (isDark ? 'bg-[#c0c1ff]/15' : 'bg-indigo-50') : ''}`}>
              <Text className="text-base"><FontAwesome5 name="box-open" size={24} color={focused ?colors.text:colors.textMuted}/></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => (
            <View className={`w-8 h-8 items-center justify-center rounded-xl ${focused ? (isDark ? 'bg-[#c0c1ff]/15' : 'bg-indigo-50') : ''}`}>
              <Text className="text-base"><Ionicons name="document-text" size={24} color={focused ?colors.text:colors.textMuted}/></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View className={`w-8 h-8 items-center justify-center rounded-xl ${focused ? (isDark ? 'bg-[#c0c1ff]/15' : 'bg-indigo-50') : ''}`}>
              <Text className="text-base"><Ionicons name="settings" size={24} color={focused ?colors.text:colors.textMuted}/></Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
