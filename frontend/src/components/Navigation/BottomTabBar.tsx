import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomTabBar({ activeTab, setActiveTab }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Ride / Pin')}>
        <Feather name="navigation" size={20} color={activeTab === 'Ride / Pin' ? '#000' : '#888'} />
        <Text style={[styles.navText, activeTab === 'Ride / Pin' && styles.navTextActive]}>Ride</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Fair Calc')}>
        <MaterialCommunityIcons name="calculator" size={20} color={activeTab === 'Fair Calc' ? '#000' : '#888'} />
        <Text style={[styles.navText, activeTab === 'Fair Calc' && styles.navTextActive]}>Fair Calc</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Activity')}>
        <Feather name="file-text" size={20} color={activeTab === 'Activity' ? '#000' : '#888'} />
        <Text style={[styles.navText, activeTab === 'Activity' && styles.navTextActive]}>Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
        <Feather name="user" size={20} color={activeTab === 'Profile' ? '#000' : '#888'} />
        <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#fff', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  navItem: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 10, color: '#888', fontWeight: '600', marginTop: 4 },
  navTextActive: { color: '#000' }
});

