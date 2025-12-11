import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Plan, Task, User } from '../models';
import UserDialog from './UserDialog';
import { patchTask } from '../api';

export interface PlanUsersDialogProps {
  visible: boolean;
  plan: Plan;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (updatedPlan: Plan) => void;
}

export default function PlanUsersDialog({
  visible,
  plan,
  tasks,
  onClose,
  onUpdate,
}: PlanUsersDialogProps) {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<'createPlanUser' | 'editPlanUser'>('createPlanUser');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userDialogInitialValues, setUserDialogInitialValues] = useState<Partial<User> | undefined>(undefined);

  // Get sorted list of users (author first, then alphabetically)
  const usersList = Object.entries(plan.users || {}).map(([userId, user]) => ({
    id: userId,
    ...user,
  }));

  const sortedUsers = usersList.sort((a, b) => {
    if (a.id === plan.authorId) return -1;
    if (b.id === plan.authorId) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  // Check if user can be deleted
  const canDeleteUser = (userId: string): boolean => {
    // Author cannot be deleted
    if (plan.authorId === userId) {
      return false;
    }

    // Check if assigned to plan
    if (plan.assigneeId === userId) {
      return false;
    }

    // Check if assigned to any task
    const isUsedInTasks = tasks.some(
      (task) => task.authorId === userId || task.assigneeId === userId
    );

    return !isUsedInTasks;
  };

  // Get reason why user cannot be deleted
  const getDeleteDisabledReason = (userId: string): string | null => {
    if (plan.authorId === userId) {
      return 'The plan author cannot be removed from the plan.';
    }

    if (plan.assigneeId === userId) {
      const userName = plan.users[userId]?.displayName || 'This user';
      return `${userName} is assigned to this plan. Please reassign the plan before deleting this user.`;
    }

    const isUsedInTasks = tasks.some(
      (task) => task.authorId === userId || task.assigneeId === userId
    );

    if (isUsedInTasks) {
      const userName = plan.users[userId]?.displayName || 'This user';
      return `${userName} is assigned to one or more tasks. Please reassign all tasks before deleting this user.`;
    }

    return null;
  };

  // Add User
  const handleAddUser = () => {
    setUserDialogMode('createPlanUser');
    setCurrentUserId(null);
    setUserDialogInitialValues({
      displayName: '',
    });
    setShowUserDialog(true);
  };

  // Edit User
  const handleEditUser = (userId: string) => {
    const user = plan.users[userId];

    setUserDialogMode('editPlanUser');
    setCurrentUserId(userId);
    setUserDialogInitialValues({
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
    setShowUserDialog(true);
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    const reason = getDeleteDisabledReason(userId);

    if (reason) {
      Alert.alert('Cannot Delete User', reason);
      return;
    }

    const user = plan.users[userId];

    Alert.alert(
      'Delete User?',
      `Are you sure you want to remove ${user.displayName} from this plan? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { [userId]: deletedUser, ...remainingUsers } = plan.users;

              const updatedPlan = {
                ...plan,
                users: remainingUsers,
              };

              // Sync to server
              await patchTask(plan.id, { users: updatedPlan.users } as any);

              // Update parent
              onUpdate(updatedPlan);
            } catch (err) {
              console.error('Failed to delete user', err);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  // Save new user
  const handleSaveNewUser = async (user: Partial<User>) => {
    try {
      const userId = `user-${Date.now()}`;

      const updatedPlan = {
        ...plan,
        users: {
          ...plan.users,
          [userId]: user as User,
        },
      };

      // Sync to server
      await patchTask(plan.id, { users: updatedPlan.users } as any);

      // Update parent
      onUpdate(updatedPlan);

      setShowUserDialog(false);
    } catch (err) {
      console.error('Failed to add user', err);
      Alert.alert('Error', 'Failed to add user');
    }
  };

  // Save edited user
  const handleSaveEditedUser = async (user: Partial<User>) => {
    try {
      const updatedPlan = {
        ...plan,
        users: {
          ...plan.users,
          [currentUserId!]: user as User,
        },
      };

      // Sync to server
      await patchTask(plan.id, { users: updatedPlan.users } as any);

      // Update parent
      onUpdate(updatedPlan);

      setShowUserDialog(false);
    } catch (err) {
      console.error('Failed to update user', err);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  // Handle save based on mode
  const handleSaveUser = (user: Partial<User>) => {
    if (userDialogMode === 'createPlanUser') {
      handleSaveNewUser(user);
    } else {
      handleSaveEditedUser(user);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Plan Users</Text>
            <TouchableOpacity onPress={handleAddUser} style={styles.headerButton}>
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* User List */}
          <ScrollView style={styles.userList}>
            {sortedUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No users in this plan</Text>
                <Text style={styles.emptySubtext}>Add users to collaborate</Text>
              </View>
            ) : (
              sortedUsers.map((user) => {
                const isAuthor = user.id === plan.authorId;
                const canDelete = canDeleteUser(user.id);
                const secondaryInfo =
                  user.email || user.phoneNumber || 'No contact info';

                return (
                  <View key={user.id} style={styles.userItem}>
                    {/* Avatar */}
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>👤</Text>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user.displayName}</Text>
                        {isAuthor && (
                          <Text style={styles.authorBadge}>(Author)</Text>
                        )}
                      </View>
                      <Text style={styles.userSecondary}>{secondaryInfo}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.userActions}>
                      <Pressable
                        onPress={() => handleEditUser(user.id)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionIcon}>✏️</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          if (canDelete) {
                            handleDeleteUser(user.id);
                          } else {
                            const reason = getDeleteDisabledReason(user.id);
                            Alert.alert('Cannot Delete User', reason || 'This user cannot be deleted.');
                          }
                        }}
                        style={[styles.actionButton, styles.deleteButton]}
                      >
                        <Text
                          style={[
                            styles.actionIcon,
                            !canDelete && styles.actionDisabled,
                          ]}
                        >
                          ✕
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* User Dialog for Add/Edit */}
      <UserDialog
        visible={showUserDialog}
        mode={userDialogMode}
        initialValues={userDialogInitialValues}
        onCancel={() => setShowUserDialog(false)}
        onSave={handleSaveUser}
      />
    </>
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
  addText: {
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
  userList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  authorBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  userSecondary: {
    fontSize: 14,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionDisabled: {
    opacity: 0.3,
  },
});
