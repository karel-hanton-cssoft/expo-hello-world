import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAllAppData } from '../storage/app';

export interface AboutDialogProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutDialog({ visible, onClose }: AboutDialogProps) {
  const handleClearData = () => {
    Alert.alert(
      'Clear All App Data?',
      'This will delete all local data including user profile and plans. The app will restart. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllAppData();
              Alert.alert('Success', 'App data cleared. Please restart the app.', [
                {
                  text: 'OK',
                  onPress: onClose,
                },
              ]);
            } catch (err) {
              console.error('Failed to clear app data', err);
              Alert.alert('Error', 'Failed to clear app data');
            }
          },
        },
      ]
    );
  };

  const handleShowAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.length === 0) {
        Alert.alert('AsyncStorage', 'AsyncStorage is empty');
        return;
      }

      const items = await AsyncStorage.multiGet(keys);
      const storageData: Record<string, any> = {};

      items.forEach(([key, value]) => {
        try {
          // Try to parse as JSON
          storageData[key] = value ? JSON.parse(value) : null;
        } catch {
          // If not JSON, store as string
          storageData[key] = value;
        }
      });

      const jsonString = JSON.stringify(storageData, null, 2);
      
      // Show in alert with scrollable view
      Alert.alert(
        'AsyncStorage Content',
        `Found ${keys.length} keys:\n\n${keys.join('\n')}\n\nCopy console for full JSON data`,
        [{ text: 'OK' }]
      );

      // Log full data to console for easy copy
      console.log('=== AsyncStorage Content ===');
      console.log(jsonString);
      console.log('=== End AsyncStorage ===');
    } catch (err) {
      console.error('Failed to read AsyncStorage', err);
      Alert.alert('Error', 'Failed to read AsyncStorage data');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.appName}>Task Planner</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>
              A comprehensive task and plan management application that helps you organize
              your work and collaborate with others.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <Text style={styles.sectionText}>
              • Create and manage plans{'\n'}
              • Organize tasks in hierarchies{'\n'}
              • Assign tasks to team members{'\n'}
              • Track task status and progress{'\n'}
              • Collaborate with multiple users
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <Text style={styles.sectionText}>
              Developed with React Native and Expo
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License</Text>
            <Text style={styles.sectionText}>
              © 2025 Task Planner. All rights reserved.
            </Text>
          </View>

          {/* Development Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Tools</Text>
            
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleShowAsyncStorage}
            >
              <Text style={styles.devButtonText}>📋 Show AsyncStorage Data</Text>
            </TouchableOpacity>
            <Text style={styles.devNote}>
              Displays all AsyncStorage keys. Full JSON data is logged to console.
            </Text>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearData}
            >
              <Text style={styles.dangerButtonText}>🗑️ Clear All App Data</Text>
            </TouchableOpacity>
            <Text style={styles.dangerNote}>
              Use this to test first launch flow. This will delete all local data.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  devButton: {
    backgroundColor: '#007aff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  devButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  devNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
});
