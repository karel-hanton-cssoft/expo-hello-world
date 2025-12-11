import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { User } from '../models/user';

export interface TaskDialogProps {
  visible: boolean;
  mode: 'create' | 'edit';
  type: 'task' | 'plan';
  users: Record<string, User>; // Plan.users dictionary for assignee selection
  initialValues?: {
    title?: string;
    description?: string;
    assigneeId?: string;
  };
  onCancel: () => void;
  onSave: (title: string, description?: string, assigneeId?: string) => void;
}

/**
 * Universal dialog for creating/editing Tasks and Plans.
 * 
 * Title varies by mode and type:
 * - "New Task" / "Edit Task" / "New Plan" / "Edit Plan"
 * 
 * Button text varies by mode:
 * - "Create" (create mode) / "Save" (edit mode)
 * 
 * For Plans: assignee field is hidden (Plans don't have assignees)
 */
export function TaskDialog({
  visible,
  mode,
  type,
  users,
  initialValues,
  onCancel,
  onSave,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);

  // Initialize values when dialog opens or initialValues change
  useEffect(() => {
    if (visible) {
      setTitle(initialValues?.title || '');
      setDescription(initialValues?.description || '');
      setAssigneeId(initialValues?.assigneeId || undefined);
    }
  }, [visible, initialValues]);

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setAssigneeId(undefined);
    onCancel();
  };

  const handleSave = () => {
    if (!title.trim()) {
      return; // Title is required
    }
    onSave(title.trim(), description.trim() || undefined, assigneeId);
    // Reset form
    setTitle('');
    setDescription('');
    setAssigneeId(undefined);
  };

  // Build dialog title
  const dialogTitle = `${mode === 'create' ? 'New' : 'Edit'} ${type === 'task' ? 'Task' : 'Plan'}`;
  
  // Build button text
  const buttonText = mode === 'create' ? 'Create' : 'Save';

  // Convert users dictionary to array for rendering
  const userEntries = Object.entries(users);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{dialogTitle}</Text>

          {/* Title Input */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            autoFocus
          />

          {/* Description Input */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            multiline
            numberOfLines={3}
          />

          {/* Assignee Selection */}
          <Text style={styles.label}>Assignee</Text>
          <ScrollView style={styles.assigneeScroll} horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.assigneeContainer}>
                  {/* Unassigned option */}
                  <TouchableOpacity
                    style={[
                      styles.assigneePill,
                      assigneeId === undefined && styles.assigneePillSelected,
                    ]}
                    onPress={() => setAssigneeId(undefined)}
                  >
                    <Text
                      style={[
                        styles.assigneeText,
                        assigneeId === undefined && styles.assigneeTextSelected,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>

                  {/* User options */}
                  {userEntries.map(([userId, user]) => (
                    <TouchableOpacity
                      key={userId}
                      style={[
                        styles.assigneePill,
                        assigneeId === userId && styles.assigneePillSelected,
                      ]}
                      onPress={() => setAssigneeId(userId)}
                    >
                      <Text
                        style={[
                          styles.assigneeText,
                          assigneeId === userId && styles.assigneeTextSelected,
                        ]}
                      >
                        {user.displayName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, !title.trim() && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  assigneeScroll: {
    maxHeight: 120,
  },
  assigneeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  assigneePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  assigneePillSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  assigneeText: {
    fontSize: 14,
    color: '#333',
  },
  assigneeTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
