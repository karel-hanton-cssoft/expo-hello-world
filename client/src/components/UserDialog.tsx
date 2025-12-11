import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { User } from '../models/user';

export interface UserDialogProps {
  visible: boolean;
  mode: 'editDefault' | 'createPlanUser' | 'editPlanUser';
  initialValues?: Partial<User>;
  isFirstLaunch?: boolean;
  onCancel: () => void;
  onSave: (user: Partial<User>) => void;
}

export default function UserDialog({
  visible,
  mode,
  initialValues,
  isFirstLaunch = false,
  onCancel,
  onSave,
}: UserDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // Initialize form with initial values
  useEffect(() => {
    if (visible && initialValues) {
      setDisplayName(initialValues.displayName || '');
      setFirstName(initialValues.firstName || '');
      setLastName(initialValues.lastName || '');
      setEmail(initialValues.email || '');
      setPhoneNumber(initialValues.phoneNumber || '');
    }
  }, [visible, initialValues]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!visible) {
      setDisplayName('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setDisplayNameError('');
    }
  }, [visible]);

  const getTitle = () => {
    if (isFirstLaunch) {
      return "Let's Set Up Your Profile";
    }
    switch (mode) {
      case 'editDefault':
        return 'Edit Default User';
      case 'createPlanUser':
        return 'New Plan User';
      case 'editPlanUser':
        return 'Edit Plan User';
      default:
        return 'User Settings';
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    // Clear previous errors
    setDisplayNameError('');

    // Validate display name
    if (!displayName.trim()) {
      setDisplayNameError('Display Name is required');
      return;
    }

    // Validate email format
    if (email && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Create user object
    const user: Partial<User> = {
      displayName: displayName.trim(),
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      email: email?.trim() || undefined,
      phoneNumber: phoneNumber?.trim() || undefined,
    };

    onSave(user);
  };

  const handleImportContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Cannot access contacts. Please grant permission in settings.'
        );
        return;
      }

      // Use the native contact picker
      const contact = await Contacts.presentContactPickerAsync();
      
      // If no contact was selected (null or undefined), return
      if (!contact) {
        return;
      }

      // Fill in the form fields from selected contact
      if (contact.name) {
        setDisplayName(contact.name);
      } else if (contact.firstName && contact.lastName) {
        setDisplayName(`${contact.firstName} ${contact.lastName}`);
      } else if (contact.firstName) {
        setDisplayName(contact.firstName);
      }
      
      if (contact.firstName) setFirstName(contact.firstName);
      if (contact.lastName) setLastName(contact.lastName);
      
      if (contact.emails && contact.emails.length > 0) {
        setEmail(contact.emails[0].email || '');
      }
      
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        setPhoneNumber(contact.phoneNumbers[0].number || '');
      }
    } catch (error) {
      console.error('Error importing contact:', error);
      Alert.alert('Error', 'Failed to import contact. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={isFirstLaunch ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {!isFirstLaunch && (
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          {isFirstLaunch && <View style={styles.headerButton} />}
          
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveText}>{isFirstLaunch ? 'Continue' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.formContainer}>
          {/* Welcome Message for First Launch */}
          {isFirstLaunch && (
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>👋 Welcome to Task Planner!</Text>
              <Text style={styles.welcomeText}>
                Let's set up your profile. You can use the default "Me" or customize it with your details.
              </Text>
              <Text style={styles.welcomeNote}>
                Note: You can import your information from contacts or fill it manually.
              </Text>
            </View>
          )}

          {/* Display Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Display Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, displayNameError ? styles.inputError : null]}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (displayNameError) setDisplayNameError('');
              }}
              placeholder="Enter display name"
              placeholderTextColor="#999"
            />
            {displayNameError ? (
              <Text style={styles.errorText}>{displayNameError}</Text>
            ) : null}
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Import from Contacts Button */}
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportContact}
          >
            <Text style={styles.importIcon}>📱</Text>
            <Text style={styles.importText}>Import from Contacts</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 12,
  },
  welcomeNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff3b30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f0f8ff',
  },
  importIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  importText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
