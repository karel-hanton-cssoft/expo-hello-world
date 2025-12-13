import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions, Alert, AppState, AppStateStatus } from 'react-native';
import { Plan } from '../models/plan';
import { Task } from '../models/task';
import { User } from '../models/user';
import { createNewTask } from '../models/task';
import PlanItem from './PlanItem';
import PlanUsersDialog from './PlanUsersDialog';
import * as api from '../api';
import { getMeUserId } from '../storage/app';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = 44; // Will be passed as prop or calculated

export interface ExamplePlan {
  plan: Plan;
  taskMap: Map<string, Task>;
  lastUpdateTimestamp: number;
  isRefreshing: boolean;
}

export interface PlanScreenProps {
  planData: ExamplePlan;
  screenIndex: number;
  isVisible: boolean;
  onUpdatePlan: (planId: string, updatedData: Partial<ExamplePlan>) => void;
  onDeletePlan: (planId: string) => void;
  onShowError: (message: string) => void;
}

/**
 * PlanScreen represents a single plan screen in the horizontal FlatList.
 * Handles:
 * - Plan UI rendering via PlanItem
 * - Data management (plan + taskMap)
 * - Server communication (REST API calls)
 * - Refresh logic with 10-second timeout
 * - Context menu for plan actions
 */
export default function PlanScreen({
  planData,
  screenIndex,
  isVisible,
  onUpdatePlan,
  onDeletePlan,
  onShowError,
}: PlanScreenProps) {
  const [planMenuVisible, setPlanMenuVisible] = useState<boolean>(false);
  const [showPlanUsersDialog, setShowPlanUsersDialog] = useState<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Auto-refresh when screen becomes visible
  useEffect(() => {
    console.log(`PlanScreen ${screenIndex} (${planData.plan.id}): isVisible=${isVisible}, tasks=${planData.taskMap.size}, lastUpdate=${planData.lastUpdateTimestamp}`);
    
    if (!isVisible) return; // Skip if not visible
    
    const shouldRefresh = 
      planData.taskMap.size === 0 || 
      (Date.now() - planData.lastUpdateTimestamp) > 10000;
    
    if (shouldRefresh && !planData.isRefreshing) {
      console.log(`Screen ${screenIndex} became visible, triggering refresh`);
      refreshPlan();
    }
  }, [isVisible]); // Trigger when visibility changes

  // AppState listener - refresh when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Check if app is returning to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log(`App returned to foreground, checking refresh for screen ${screenIndex}`);
        
        // Only refresh if this screen is visible
        if (isVisible) {
          const shouldRefresh = 
            planData.taskMap.size === 0 || 
            (Date.now() - planData.lastUpdateTimestamp) > 10000;
          
          if (shouldRefresh && !planData.isRefreshing) {
            console.log(`Screen ${screenIndex} triggered refresh on foreground`);
            refreshPlan();
          }
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isVisible, planData.taskMap.size, planData.lastUpdateTimestamp, planData.isRefreshing]);

  const refreshPlan = async () => {
    // Check 10-second timeout
    const now = Date.now();
    if ((now - planData.lastUpdateTimestamp) <= 10000) {
      console.log(`Refresh skipped: too soon (${now - planData.lastUpdateTimestamp}ms ago)`);
      return;
    }

    // Guard against duplicate refreshes
    if (planData.isRefreshing) {
      console.log('Refresh already in progress');
      return;
    }

    // Set refreshing flag
    onUpdatePlan(planData.plan.id, { isRefreshing: true });

    try {
      // Fetch plan subtree from server
      const result = await api.fetchPlanSubtree(planData.plan.id);
      
      // Find the root plan task
      const planTask = result.items.find(t => t.id === planData.plan.id);
      if (!planTask) {
        console.warn(`Plan task ${planData.plan.id} not in result`);
        onUpdatePlan(planData.plan.id, {
          isRefreshing: false,
          lastUpdateTimestamp: Date.now(),
        });
        return;
      }
      
      // Get accessKey from AsyncStorage (never from server)
      const { getPlan } = await import('../storage/app');
      const storedPlanData = await getPlan(planData.plan.id);
      const accessKey = storedPlanData?.accessKey || planData.plan.accessKey;
      
      // Merge plan with local accessKey
      const mergedPlan = {
        ...planTask,
        accessKey: accessKey,
        users: {
          ...(planTask as Plan).users,
          // Preserve any local-only user additions
          ...planData.plan.users,
        }
      } as Plan;
      
      // Update state with refreshed data
      const newTaskMap = new Map<string, Task>();
      result.items.forEach(t => newTaskMap.set(t.id, t));
      
      onUpdatePlan(planData.plan.id, {
        plan: mergedPlan,
        taskMap: newTaskMap,
        lastUpdateTimestamp: Date.now(),
        isRefreshing: false,
      });
      
      console.log(`Refreshed plan ${planData.plan.id}, loaded ${result.items.length} tasks`);
      
    } catch (err: any) {
      console.error(`Failed to refresh plan ${planData.plan.id}:`, err);
      // Keep existing data, update flags
      onUpdatePlan(planData.plan.id, {
        isRefreshing: false,
        lastUpdateTimestamp: Date.now(), // Set timestamp to prevent immediate retry
      });
      
      // Show offline banner if we have cached data
      if (planData.taskMap.size > 0) {
        onShowError('Using offline data');
      } else {
        onShowError('Cannot load plan (offline)');
      }
    }
  };

  const togglePlanMenu = () => {
    setPlanMenuVisible(!planMenuVisible);
  };

  const closePlanMenu = () => {
    setPlanMenuVisible(false);
  };

  const handlePlanMenuItemPress = (action: () => void) => {
    action();
    closePlanMenu();
  };

  const openPlanUsersDialog = () => {
    setShowPlanUsersDialog(true);
  };

  const handlePlanUpdate = (updatedPlan: Plan) => {
    onUpdatePlan(planData.plan.id, { plan: updatedPlan });
  };

  /**
   * Recursively collect all task IDs that should be deleted (task + all subtasks).
   */
  const collectTaskIdsToDelete = (taskId: string, allTasks: Map<string, Task>): string[] => {
    const task = allTasks.get(taskId);
    if (!task) return [taskId];

    const ids = [taskId];
    // Recursively collect subtask IDs
    (task.subtaskIds || []).forEach(subtaskId => {
      ids.push(...collectTaskIdsToDelete(subtaskId, allTasks));
    });
    return ids;
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Build task map for recursive collection (add plan to it)
      const taskMap = new Map(planData.taskMap);
      taskMap.set(planData.plan.id, planData.plan);

      // Collect all task IDs to delete (including subtasks recursively)
      const idsToDelete = collectTaskIdsToDelete(taskId, taskMap);
      const count = idsToDelete.length;

      // Show confirmation dialog
      Alert.alert(
        'Delete Confirmation',
        `Delete this task and ${count === 1 ? 'no' : count - 1} subtask(s)? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete all tasks from server
                await Promise.all(
                  idsToDelete.map(id => 
                    api.deleteTask(id).catch(err => {
                      console.warn(`Failed to delete task ${id} from server:`, err);
                    })
                  )
                );

                // Delete task - remove from parent's subtaskIds
                const task = taskMap.get(taskId);
                if (task && task.parentId) {
                  const parent = taskMap.get(task.parentId);
                  if (parent) {
                    const updatedSubtaskIds = (parent.subtaskIds || []).filter(id => id !== taskId);
                    await api.patchTask(parent.id, { subtaskIds: updatedSubtaskIds }).catch(err => {
                      console.warn('Failed to update parent subtaskIds:', err);
                    });
                  }
                }

                // Remove tasks from local state
                const updatedTaskMap = new Map<string, Task>();
                planData.taskMap.forEach((task, id) => {
                  if (!idsToDelete.includes(id)) {
                    updatedTaskMap.set(id, task);
                  }
                });
                
                const updatedPlan = idsToDelete.includes(planData.plan.id) ? planData.plan : {
                  ...planData.plan,
                  subtaskIds: (planData.plan.subtaskIds || []).filter(id => id !== taskId)
                };

                onUpdatePlan(planData.plan.id, {
                  taskMap: updatedTaskMap,
                  plan: updatedPlan,
                });

                Alert.alert('Success', `Deleted ${count} task(s)`);
              } catch (err: any) {
                console.error('Failed to delete task:', err);
                Alert.alert('Error', 'Failed to delete: ' + (err.message || 'Unknown error'));
              }
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('Failed to prepare delete:', err);
      Alert.alert('Error', 'Cannot delete: ' + (err.message || 'Unknown error'));
    }
  };

  // Wrapper functions for PlanItem
  const handleSaveTaskFromPlanItem = async (taskId: string, title: string, description?: string, assigneeId?: string) => {
    // PATCH to server
    const updates: Partial<Task> = { title, description };
    if (assigneeId !== undefined) updates.assigneeId = assigneeId;
    
    await api.patchTask(taskId, updates);

    // Update local state
    if (taskId === planData.plan.id) {
      // Editing the plan itself
      const updatedPlan = { ...planData.plan, ...updates };
      onUpdatePlan(planData.plan.id, { plan: updatedPlan });
    } else {
      // Editing a task
      const updatedTaskMap = new Map(planData.taskMap);
      const existingTask = updatedTaskMap.get(taskId);
      if (existingTask) {
        updatedTaskMap.set(taskId, { ...existingTask, ...updates });
      }
      onUpdatePlan(planData.plan.id, { taskMap: updatedTaskMap });
    }
  };

  const handleCreateTaskFromPlanItem = async (parentId: string, title: string, description?: string, assigneeId?: string) => {
    // Get meUserId from AsyncStorage
    const meUserId = await getMeUserId(planData.plan.id);
    if (!meUserId) {
      Alert.alert('Error', 'User ID not found');
      throw new Error('User ID not found');
    }

    // Create new task
    const newTask = createNewTask(parentId, meUserId);
    newTask.title = title;
    if (description) newTask.description = description;
    if (assigneeId) newTask.assigneeId = assigneeId;

    // POST to server
    await api.postTask(newTask);

    // Update parent's subtaskIds
    const parent = parentId === planData.plan.id 
      ? planData.plan 
      : planData.taskMap.get(parentId);
    
    if (parent) {
      const updatedSubtaskIds = [...(parent.subtaskIds || []), newTask.id];
      await api.patchTask(parent.id, { subtaskIds: updatedSubtaskIds });

      // Update local state
      const updatedPlan = parentId === planData.plan.id
        ? { ...planData.plan, subtaskIds: updatedSubtaskIds }
        : planData.plan;
      
      const updatedTaskMap = new Map(planData.taskMap);
      if (parentId !== planData.plan.id) {
        const parentTask = updatedTaskMap.get(parentId);
        if (parentTask) {
          updatedTaskMap.set(parentId, { ...parentTask, subtaskIds: updatedSubtaskIds });
        }
      }
      updatedTaskMap.set(newTask.id, newTask);

      onUpdatePlan(planData.plan.id, {
        plan: updatedPlan,
        taskMap: updatedTaskMap,
      });
    }
  };

  return (
    <View style={[styles.screenContainer, { width: SCREEN_WIDTH }]}>
      {/* Plan Content */}
      <PlanItem
        plan={planData.plan}
        taskMap={planData.taskMap}
        isRefreshing={planData.isRefreshing}
        onSaveTask={handleSaveTaskFromPlanItem}
        onCreateTask={handleCreateTaskFromPlanItem}
        onDeleteTask={handleDeleteTask}
        onDeletePlan={onDeletePlan}
      />

      {/* Context Menu Button - positioned in header (will be portal/absolute) */}
      {/* Note: Context menu button is rendered in App.tsx header for now */}

      {/* Plan Context Menu */}
      {planMenuVisible && (
        <>
          <Pressable 
            style={styles.menuBackdrop} 
            onPress={closePlanMenu}
          />
          <View style={[styles.planMenuContainer, { top: STATUS_BAR_HEIGHT + 60 }]}>
            <Pressable 
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handlePlanMenuItemPress(openPlanUsersDialog)}
            >
              <Text style={styles.menuIcon}>👥</Text>
              <Text style={styles.menuLabel}>Users</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Plan Users Dialog */}
      <PlanUsersDialog
        visible={showPlanUsersDialog}
        plan={planData.plan}
        tasks={Array.from(planData.taskMap.values())}
        onClose={() => setShowPlanUsersDialog(false)}
        onUpdate={handlePlanUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },

  // Menu styles
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },

  planMenuContainer: {
    position: 'absolute',
    right: 0,
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    marginRight: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },

  menuLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
