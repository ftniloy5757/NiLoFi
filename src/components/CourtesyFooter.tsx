import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import THEME from '../constants/theme';

export const CourtesyFooter: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.courtesyText}>© 2026 Farhan T. Niloy</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  courtesyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: '500',
  },
});

export default CourtesyFooter;
