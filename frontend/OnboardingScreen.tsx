import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Decorative Top */}
        <View style={styles.iconCircle}>
          <MaterialIcons name="local-taxi" size={60} color="#d97706" />
        </View>
        
        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialIcons name="security" size={14} color="#059669" />
            <Text style={styles.badgeText}>Regulated Rates</Text>
          </View>
          <View style={styles.badge}>
            <FontAwesome5 name="shield-alt" size={12} color="#2563eb" />
            <Text style={[styles.badgeText, { color: '#2563eb' }]}>Zero Surge</Text>
          </View>
        </View>

        {/* Text Content */}
        <Text style={styles.title}>Welcome to{'\n'}MulticabFairs</Text>
        <Text style={styles.subtitle}>
          The smartest way to commute between Tacloban and Palo. Transparent, fair, and reliable metered rides.
        </Text>

        {/* Features List */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="map-pin" size={18} color="#d97706" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Accurate Pinning</Text>
              <Text style={styles.featureSub}>Powered by high-precision maps.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: '#ecfdf5' }]}>
              <MaterialIcons name="attach-money" size={20} color="#059669" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Fair Calculations</Text>
              <Text style={styles.featureSub}>Municipal standard rates only.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 6,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 46,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  featureSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#92400e',
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  }
});
