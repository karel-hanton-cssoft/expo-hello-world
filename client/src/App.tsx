import React, { useMemo, useState, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  SafeAreaView,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import EXAMPLE_PLANS from './data/examples';
import * as api from './api';
import type { Task, Plan, User } from './models';
import { createNewPlan, getUniqueUserId } from './models/plan';
import { createNewTask } from './models/task';
import { getDefaultUser, generateAccessKey, addPlan, getMeUserId, removePlan, saveDefaultUser } from './storage/app';
import { TaskDialog } from './components/TaskDialog';
import TaskItem from './components/TaskItem';
import AboutDialog from './components/AboutDialog';
import UserDialog from './components/UserDialog';
import PlanUsersDialog from './components/PlanUsersDialog';

type ExamplePlan = { 
  plan: Plan; 
  tasks: Task[];
  lastUpdateTimestamp: number;  // Unix timestamp of last refresh
  isRefreshing: boolean;         // Refresh in progress flag
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function App() {
  const [selected, setSelected] = useState<ExamplePlan | null>(null);
  const [plans, setPlans] = useState<ExamplePlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogType, setDialogType] = useState<'task' | 'plan'>('task');
  const [taskParentId, setTaskParentId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [dialogInitialValues, setDialogInitialValues] = useState<{title?: string; description?: string; assigneeId?: string} | undefined>(undefined);
  const [defaultUserForDialog, setDefaultUserForDialog] = useState<Record<string, User>>({});
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [showAboutDialog, setShowAboutDialog] = useState<boolean>(false);
  const [showUserDialog, setShowUserDialog] = useState<boolean>(false);
  const [userDialogMode, setUserDialogMode] = useState<'editDefault' | 'createPlanUser' | 'editPlanUser'>('editDefault');
  const [userDialogInitialValues, setUserDialogInitialValues] = useState<Partial<User> | undefined>(undefined);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const [planMenuVisible, setPlanMenuVisible] = useState<boolean>(false);
  const [showPlanUsersDialog, setShowPlanUsersDialog] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  function handleOpen(p: ExamplePlan) {
    setSelected(p);
  }

  function handleClose() {
    setSelected(null);
  }

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleMenuItemPress = (action: () => void) => {
    action();
    closeMenu();
  };

  const openAboutDialog = () => {
    setShowAboutDialog(true);
  };

  const openDefaultUserDialog = async () => {
    try {
      const defaultUser = await getDefaultUser();
      setUserDialogMode('editDefault');
      setUserDialogInitialValues({
        displayName: defaultUser.displayName,
        firstName: defaultUser.firstName,
        lastName: defaultUser.lastName,
        email: defaultUser.email,
        phoneNumber: defaultUser.phoneNumber,
      });
      setShowUserDialog(true);
    } catch (err) {
      console.error('Failed to load default user', err);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const handleSaveDefaultUser = async (user: Partial<User>) => {
    try {
      await saveDefaultUser(user as User);
      setShowUserDialog(false);
      setIsFirstLaunch(false);
      
      // Initialize app settings if first launch
      if (isFirstLaunch) {
        const { setAppSettings } = await import('./storage/app');
        await setAppSettings({});
      }
      
      Alert.alert('Success', 'Default user updated successfully');
    } catch (err) {
      console.error('Failed to save default user', err);
      Alert.alert('Error', 'Failed to save user data');
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const { getDefaultUser } = await import('./storage/app');
      const user = await getDefaultUser();
      
      // Check if this is truly first launch (default user is just "Me")
      const isDefaultProfile = user.displayName === 'Me' && 
                               !user.firstName && 
                               !user.lastName && 
                               !user.email && 
                               !user.phoneNumber;
      
      if (isDefaultProfile) {
        // First launch - show setup dialog
        setIsFirstLaunch(true);
        setUserDialogMode('editDefault');
        setUserDialogInitialValues({
          displayName: 'Me',
        });
        setShowUserDialog(true);
      }
    } catch (err) {
      console.error('Failed to check first launch', err);
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
    // Update plan in plans array
    setPlans(prevPlans => 
      prevPlans.map(p => 
        p.plan.id === updatedPlan.id ? { ...p, plan: updatedPlan } : p
      )
    );
  };

  const openCreatePlanDialog = async () => {
    setDialogMode('create');
    setDialogType('plan');
    setTaskParentId(null);
    setEditTaskId(null);
    setDialogInitialValues(undefined);
    
    // Load default user for assignee selection
    try {
      const defaultUser = await getDefaultUser();
      const tempUserId = 'user-1';
      setDefaultUserForDialog({ [tempUserId]: defaultUser });
    } catch (err) {
      console.warn('Failed to load default user for dialog', err);
      setDefaultUserForDialog({});
    }
    
    setShowDialog(true);
  };

  const openCreateTaskDialog = (parentId: string) => {
    setDialogMode('create');
    setDialogType('task');
    setTaskParentId(parentId);
    setEditTaskId(null);
    setDialogInitialValues(undefined);
    setShowDialog(true);
  };

  const openEditDialog = (taskOrPlan: Task | Plan, type: 'task' | 'plan') => {
    setDialogMode('edit');
    setDialogType(type);
    setEditTaskId(taskOrPlan.id);
    setTaskParentId(null);
    setDialogInitialValues({
      title: taskOrPlan.title,
      description: taskOrPlan.description,
      assigneeId: 'assigneeId' in taskOrPlan ? taskOrPlan.assigneeId : undefined,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setDialogMode('create');
    setDialogType('task');
    setTaskParentId(null);
    setEditTaskId(null);
    setDialogInitialValues(undefined);
    setDefaultUserForDialog({});
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

  const handleDeleteTask = async (taskId: string, isPlan: boolean) => {
    try {
      // Find the plan containing this task
      const planData = plans.find(p => 
        p.plan.id === taskId || p.tasks.some(t => t.id === taskId)
      );
      if (!planData) {
        Alert.alert('Error', 'Task not found');
        return;
      }

      // Build task map for recursive collection
      const taskMap = new Map<string, Task>();
      if (isPlan) {
        taskMap.set(planData.plan.id, planData.plan);
      }
      planData.tasks.forEach(t => taskMap.set(t.id, t));

      // Collect all task IDs to delete (including subtasks recursively)
      const idsToDelete = collectTaskIdsToDelete(taskId, taskMap);
      const count = idsToDelete.length;

      // Show confirmation dialog
      Alert.alert(
        'Delete Confirmation',
        isPlan 
          ? `Delete this plan and all ${count} task(s)? This cannot be undone.`
          : `Delete this task and ${count === 1 ? 'no' : count - 1} subtask(s)? This cannot be undone.`,
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

                if (isPlan) {
                  // Delete plan from AsyncStorage
                  await removePlan(taskId);

                  // Remove plan from local state
                  setPlans(prev => prev.filter(p => p.plan.id !== taskId));

                  // Navigate away from deleted plan
                  setTimeout(() => {
                    if (currentIndex > 0) {
                      flatListRef.current?.scrollToIndex({
                        index: Math.max(0, currentIndex - 1),
                        animated: true,
                      });
                    }
                  }, 100);
                } else {
                  // Delete task (not plan) - remove from parent's subtaskIds
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
                  setPlans(prev => prev.map(p => {
                    if (p.plan.id === planData.plan.id) {
                      return {
                        ...p,
                        tasks: p.tasks.filter(t => !idsToDelete.includes(t.id)),
                        plan: idsToDelete.includes(p.plan.id) ? p.plan : {
                          ...p.plan,
                          subtaskIds: (p.plan.subtaskIds || []).filter(id => id !== taskId)
                        }
                      };
                    }
                    return p;
                  }));
                }

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

  const handleSaveTask = async (title: string, description?: string, assigneeId?: string) => {
    try {
      if (dialogMode === 'edit') {
        // Edit existing task/plan
        if (!editTaskId) return;
        
        // Find the task/plan to edit
        const planData = plans.find(p => 
          p.plan.id === editTaskId || p.tasks.some(t => t.id === editTaskId)
        );
        if (!planData) {
          Alert.alert('Error', 'Task not found');
          return;
        }

        // PATCH to server
        const updates: Partial<Task> = { title, description };
        if (assigneeId !== undefined) updates.assigneeId = assigneeId;
        
        await api.patchTask(editTaskId, updates);

        // Update local state
        setPlans(prev => prev.map(p => {
          if (p.plan.id === editTaskId) {
            return { ...p, plan: { ...p.plan, ...updates } };
          }
          if (p.tasks.some(t => t.id === editTaskId)) {
            return {
              ...p,
              tasks: p.tasks.map(t => t.id === editTaskId ? { ...t, ...updates } : t)
            };
          }
          return p;
        }));

        closeDialog();
      } else if (dialogMode === 'create' && dialogType === 'plan') {
        // Create new plan
        // Check for duplicate title
        const existingTitles = plans.map(p => p.plan.title.toLowerCase());
        if (existingTitles.includes(title.toLowerCase())) {
          Alert.alert(
            'Duplicate Title',
            'Plan with this name exists. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue', 
                onPress: () => performCreatePlan(title, description),
              },
            ]
          );
          return;
        }

        await performCreatePlan(title, description);
      } else if (dialogMode === 'create' && dialogType === 'task') {
        // Create new task
        if (!taskParentId) return;

        const parentPlan = plans.find(p => 
          p.plan.id === taskParentId || p.tasks.some(t => t.id === taskParentId)
        );
        if (!parentPlan) {
          Alert.alert('Error', 'Parent not found');
          return;
        }

        // Get meUserId from AsyncStorage
        const meUserId = await getMeUserId(parentPlan.plan.id);
        if (!meUserId) {
          Alert.alert('Error', 'User ID not found');
          return;
        }

        // Create new task
        const newTask = createNewTask(taskParentId, meUserId);
        newTask.title = title;
        if (description) newTask.description = description;
        if (assigneeId) newTask.assigneeId = assigneeId;

        // POST to server
        await api.postTask(newTask);

        // Update parent's subtaskIds
        const parent = taskParentId === parentPlan.plan.id 
          ? parentPlan.plan 
          : parentPlan.tasks.find(t => t.id === taskParentId);
        
        if (parent) {
          const updatedSubtaskIds = [...(parent.subtaskIds || []), newTask.id];
          await api.patchTask(parent.id, { subtaskIds: updatedSubtaskIds });

          // Update local state
          setPlans(prev => prev.map(p => {
            if (p.plan.id === parentPlan.plan.id) {
              return {
                ...p,
                plan: p.plan.id === taskParentId 
                  ? { ...p.plan, subtaskIds: updatedSubtaskIds }
                  : p.plan,
                tasks: p.tasks.map(t => 
                  t.id === taskParentId 
                    ? { ...t, subtaskIds: updatedSubtaskIds }
                    : t
                ).concat(newTask)
              };
            }
            return p;
          }));
        }

        closeDialog();
      }
    } catch (err: any) {
      console.error('Failed to save task/plan', err);
      Alert.alert('Error', 'Cannot save: ' + (err.message || 'Unknown error'));
    }
  };

  const performCreatePlan = async (title: string, description?: string) => {
    try {
      // Get default user and generate IDs
      const defaultUser = await getDefaultUser();
      const accessKey = generateAccessKey();
      const meUserId = getUniqueUserId({});

      // Create new plan object
      const newPlan = createNewPlan(title, description, accessKey, meUserId, defaultUser);

      // Save to AsyncStorage
      await addPlan(newPlan.id, accessKey, meUserId);

      // Add to local state
      const newExamplePlan: ExamplePlan = {
        plan: newPlan,
        tasks: [],
        lastUpdateTimestamp: Date.now(), // Just created
        isRefreshing: false,
      };
      setPlans(prev => [...prev, newExamplePlan]);

      // Close dialog
      closeDialog();

      // Navigate to new plan (last plan before Create Screen)
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: plans.length, // New plan will be at this index
          animated: true,
        });
      }, 100);

      // Sync to server in background
      api.postTask(newPlan).catch(err => {
        console.warn('Failed to sync plan to server', err);
        setError('Offline - plan saved locally');
      });
    } catch (err: any) {
      console.error('Failed to create plan', err);
      throw err;
    }
  };

  const handleAddSubtask = (parentId: string) => {
    openCreateTaskDialog(parentId);
  };

  const handleViewDetails = (taskId: string) => {
    // Find the task
    const planData = plans.find(p => 
      p.tasks.some(t => t.id === taskId)
    );
    if (!planData) {
      Alert.alert('Task Details', `Task ID: ${taskId}\nNot found`);
      return;
    }
    const task = planData.tasks.find(t => t.id === taskId);
    if (task) {
      openEditDialog(task, 'task');
    }
  };

  // UC-07: Application Startup - metadata-only load
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Check for first launch before loading data
      await checkFirstLaunch();
      
      try {
        // Load plan IDs from AsyncStorage (metadata only)
        const { getPlans } = await import('./storage/app');
        const planIds = await getPlans();
        
        if (planIds.length === 0) {
          // No plans - show Create Plan Screen
          console.log('No plans in AsyncStorage');
          if (mounted) {
            setPlans([]);
            setLoading(false);
          }
          return;
        }
        
        // Prepare empty ExamplePlan structures (tasks will be loaded on demand)
        const emptyPlans: ExamplePlan[] = planIds.map(planId => ({
          plan: {
            id: planId,
            title: 'Loading...',
            status: 'new',
            authorId: '',
            subtaskIds: [],
            createdAt: new Date().toISOString(),
            users: {},
            accessKey: '',
          } as Plan,
          tasks: [],
          lastUpdateTimestamp: 0, // Never refreshed yet
          isRefreshing: false,
        }));
        
        if (mounted) {
          setPlans(emptyPlans);
          console.log(`Prepared ${emptyPlans.length} plan screens (tasks not loaded yet)`);
        }
      } catch (err: any) {
        console.error('Failed to load plans from AsyncStorage:', err);
        setError(String(err?.message || err));
        if (mounted) setPlans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-close Plan Context Menu when plan changes
  React.useEffect(() => {
    if (planMenuVisible) {
      closePlanMenu();
    }
  }, [currentIndex]);

  // UC-08: Refresh plan data when screen becomes visible
  const refreshPlan = async (planIndex: number) => {
    if (planIndex < 0 || planIndex >= plans.length) return;
    const plan = plans[planIndex];
    
    // Check if refresh is needed (timeout: 10 seconds)
    const now = Date.now();
    const refreshTimeout = 10000; // 10 seconds
    const shouldRefresh = (now - plan.lastUpdateTimestamp) > refreshTimeout;
    
    if (!shouldRefresh) {
      console.log(`Plan ${plan.plan.id} recently refreshed, skipping`);
      return;
    }
    
    // Check if already refreshing
    if (plan.isRefreshing) {
      console.log(`Plan ${plan.plan.id} already refreshing, skipping`);
      return;
    }
    
    try {
      // Set refreshing flag
      setPlans(prev => prev.map((p, i) => 
        i === planIndex ? { ...p, isRefreshing: true } : p
      ));
      
      console.log(`Refreshing plan ${plan.plan.id}...`);
      
      // Fetch plan subtree from server
      const result = await api.fetchPlanSubtree(plan.plan.id);
      
      if (result.items.length === 0) {
        console.warn(`Plan ${plan.plan.id} not found on server`);
        // Keep existing data, just update timestamp
        setPlans(prev => prev.map((p, i) => 
          i === planIndex ? { 
            ...p, 
            isRefreshing: false,
            lastUpdateTimestamp: Date.now() 
          } : p
        ));
        return;
      }
      
      // Find the plan task (root)
      const planTask = result.items.find(t => t.id === plan.plan.id);
      if (!planTask) {
        console.warn(`Plan task ${plan.plan.id} not in result`);
        setPlans(prev => prev.map((p, i) => 
          i === planIndex ? { 
            ...p, 
            isRefreshing: false,
            lastUpdateTimestamp: Date.now() 
          } : p
        ));
        return;
      }
      
      // Get accessKey from AsyncStorage (never from server)
      const { getPlan } = await import('./storage/app');
      const planData = await getPlan(plan.plan.id);
      const accessKey = planData?.accessKey || plan.plan.accessKey;
      
      // Merge plan with local accessKey
      const mergedPlan = {
        ...planTask,
        accessKey: accessKey,
        users: {
          ...(planTask as Plan).users,
          // Preserve any local-only user additions
          ...plan.plan.users,
        }
      } as Plan;
      
      // Update state with refreshed data
      setPlans(prev => prev.map((p, i) => 
        i === planIndex ? {
          plan: mergedPlan,
          tasks: result.items,
          lastUpdateTimestamp: Date.now(),
          isRefreshing: false,
        } : p
      ));
      
      console.log(`Refreshed plan ${plan.plan.id}, loaded ${result.items.length} tasks`);
      
    } catch (err: any) {
      console.error(`Failed to refresh plan ${plan.plan.id}:`, err);
      // Keep existing data, update flags
      setPlans(prev => prev.map((p, i) => 
        i === planIndex ? { 
          ...p, 
          isRefreshing: false,
          lastUpdateTimestamp: Date.now() // Set timestamp to prevent immediate retry
        } : p
      ));
      
      // Show offline banner if we have cached data
      if (plan.tasks.length > 0) {
        setError('Using offline data');
      } else {
        setError('Cannot load plan (offline)');
      }
    }
  };

  // Trigger refresh when currentIndex changes (user swipes to screen)
  React.useEffect(() => {
    if (loading) return; // Don't refresh during initial load
    if (currentIndex >= plans.length) return; // Create Plan Screen
    
    // Refresh the currently visible plan
    refreshPlan(currentIndex);
  }, [currentIndex, loading]);

  // Create screens array: plans + Create Plan Screen
  type ScreenItem = ExamplePlan | { isCreateScreen: true };
  const screens: ScreenItem[] = [...plans, { isCreateScreen: true }];

  const renderScreen = ({ item, index }: { item: any; index: number }) => {
    if (item.isCreateScreen) {
      // Create Plan Screen
      return (
        <View style={[styles.screenContainer, { width: SCREEN_WIDTH }]}>
          <Pressable 
            style={styles.createPlanScreen}
            onPress={openCreatePlanDialog}
          >
            <Text style={styles.createPlanIcon}>+</Text>
            <Text style={styles.createPlanText}>Create new Plan</Text>
          </Pressable>
        </View>
      );
    }

    // Plan Screen
    const plan = item as ExamplePlan;
    
    // Build task lookup map
    const taskMap = new Map<string, Task>();
    plan.tasks.forEach(t => taskMap.set(t.id, t));
    
    // Find root tasks (direct children of plan)
    const rootTasks = plan.tasks.filter(t => t.parentId === plan.plan.id);
    
    // Get subtasks for each root task
    const subtasksMap = new Map<string, Task[]>();
    plan.tasks.forEach(task => {
      if (task.parentId && task.parentId !== plan.plan.id) {
        const siblings = subtasksMap.get(task.parentId) || [];
        siblings.push(task);
        subtasksMap.set(task.parentId, siblings);
      }
    });
    
    return (
      <View style={[styles.screenContainer, { width: SCREEN_WIDTH }]}>
        <ScrollView style={styles.planScreen}>
          <View style={styles.planHeader}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.planHeaderTitle}>{plan.plan.title}</Text>
              <View style={styles.iconButtons}>
                <Pressable 
                  style={styles.editIcon}
                  onPress={() => openEditDialog(plan.plan, 'plan')}
                >
                  <Text style={styles.editIconText}>✏️</Text>
                </Pressable>
                <Pressable 
                  style={styles.deleteIcon}
                  onPress={() => handleDeleteTask(plan.plan.id, true)}
                >
                  <Text style={styles.deleteIconText}>✕</Text>
                </Pressable>
              </View>
            </View>
            {plan.plan.description && (
              <Text style={styles.planHeaderSubtitle}>{plan.plan.description}</Text>
            )}
            {/* Assignee Pill */}
            <View style={styles.assigneePillContainer}>
              {plan.plan.assigneeId && plan.plan.users && plan.plan.users[plan.plan.assigneeId] ? (
                <View style={styles.assigneePill}>
                  <Text style={styles.assigneePillText}>
                    {plan.plan.users[plan.plan.assigneeId].displayName}
                  </Text>
                </View>
              ) : (
                <View style={[styles.assigneePill, styles.assigneePillUnassigned]}>
                  <Text style={[styles.assigneePillText, styles.assigneePillTextUnassigned]}>
                    Unassigned
                  </Text>
                </View>
              )}
            </View>
            <View style={{ height: 3, backgroundColor: '#007AFF', marginTop: 12 }} />
          </View>
          
          <View style={styles.planActions}>
            <Pressable
              style={styles.planActionButton}
              onPress={() => handleOpen(plan)}
            >
              <Text style={styles.planActionButtonText}>View Details</Text>
            </Pressable>
            <Pressable
              style={[styles.planActionButton, { backgroundColor: '#28a745' }]}
              onPress={() => handleAddSubtask(plan.plan.id)}
            >
              <Text style={styles.planActionButtonText}>+ Add Task</Text>
            </Pressable>
          </View>
          
          <View style={styles.tasksContainer}>
            {rootTasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks yet. Add your first task!</Text>
            ) : (
              rootTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  subtasks={subtasksMap.get(task.id) || []}
                  allTasks={taskMap}
                  planUsers={plan.plan.users || {}}
                  onAddSubtask={handleAddSubtask}
                  onViewDetails={handleViewDetails}
                  onDelete={(taskId) => handleDeleteTask(taskId, false)}
                  level={0}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Floating header - positioned below status bar */}
      <View style={[styles.floatingHeader, { top: STATUS_BAR_HEIGHT }]}>
        <View style={styles.headerRow}>
          {/* Hamburger Menu Icon */}
          <Pressable onPress={toggleMenu} style={styles.hamburgerButton}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </Pressable>
          
          <Text style={styles.title}>Plans ({currentIndex + 1}/{screens.length})</Text>
          <Pressable
            onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                const tasks = await api.fetchAllTasks(1000);
                const grouped = api.groupIntoPlans(tasks) as ExamplePlan[];
                
                // Merge with existing plans to preserve users
                const mergedPlans = grouped.map(newPlan => {
                  const existingPlan = plans.find(p => p.plan.id === newPlan.plan.id);
                  if (existingPlan && existingPlan.plan.users) {
                    const hasUsers = newPlan.plan.users && Object.keys(newPlan.plan.users).length > 0;
                    return {
                      ...newPlan,
                      plan: {
                        ...newPlan.plan,
                        users: hasUsers ? newPlan.plan.users : existingPlan.plan.users,
                        accessKey: newPlan.plan.accessKey || existingPlan.plan.accessKey,
                      }
                    };
                  }
                  return newPlan;
                });
                
                setPlans(mergedPlans);
              } catch (e: any) {
                setError(String(e?.message || e));
                // Fallback to example plans with metadata
                const fallbackPlans: ExamplePlan[] = EXAMPLE_PLANS.map((ex: any) => ({
                  plan: ex.plan,
                  tasks: ex.tasks,
                  lastUpdateTimestamp: 0,
                  isRefreshing: false,
                }));
                setPlans(fallbackPlans);
              } finally {
                setLoading(false);
              }
            }}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
          
          {/* Plan Context Menu - pouze pokud je zobrazený validní plán */}
          {currentIndex < plans.length && !(screens[currentIndex] as any).isCreateScreen && (
            <Pressable onPress={togglePlanMenu} style={styles.contextMenuButton}>
              <Text style={styles.contextMenuIcon}>⋮</Text>
            </Pressable>
          )}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Using local data</Text>
            <Text style={styles.localBadge}>LOCAL</Text>
          </View>
        )}
      </View>

      <FlatList<ScreenItem>
        ref={flatListRef}
        data={screens}
        renderItem={renderScreen}
        keyExtractor={(item, index) =>
          'isCreateScreen' in item && item.isCreateScreen ? 'create-screen' : (item as ExamplePlan).plan.id
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={handleClose}>
        {selected && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected.plan.title}</Text>
              <Pressable onPress={handleClose} style={styles.closeButton} accessibilityRole="button">
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Plan (raw)</Text>
              <View style={styles.jsonBox}>
                <Text style={styles.mono}>{JSON.stringify(selected.plan, null, 2)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Tasks (tree)</Text>
              <TaskTree plan={selected.plan} tasks={selected.tasks} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      <TaskDialog
        visible={showDialog}
        mode={dialogMode}
        type={dialogType}
        users={
          // Find users from the relevant plan
          taskParentId 
            ? plans.find(p => p.plan.id === taskParentId || p.tasks.some(t => t.id === taskParentId))?.plan.users || {}
            : editTaskId
              ? plans.find(p => p.plan.id === editTaskId || p.tasks.some(t => t.id === editTaskId))?.plan.users || {}
              : defaultUserForDialog  // Use default user for Create Plan mode
        }
        initialValues={dialogInitialValues}
        onCancel={closeDialog}
        onSave={handleSaveTask}
      />

      {/* Global Menu */}
      {menuVisible && (
        <>
          <Pressable 
            style={styles.menuBackdrop} 
            onPress={closeMenu}
          />
          <View style={styles.menuContainer}>
            <Pressable 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(openDefaultUserDialog)}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuLabel}>Default User</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleMenuItemPress(openAboutDialog)}
            >
              <Text style={styles.menuIcon}>ℹ️</Text>
              <Text style={styles.menuLabel}>About</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* About Dialog */}
      <AboutDialog
        visible={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />

      {/* User Dialog */}
      <UserDialog
        visible={showUserDialog}
        mode={userDialogMode}
        initialValues={userDialogInitialValues}
        isFirstLaunch={isFirstLaunch}
        onCancel={() => setShowUserDialog(false)}
        onSave={handleSaveDefaultUser}
      />

      {/* Plan Context Menu */}
      {planMenuVisible && (
        <>
          <Pressable 
            style={styles.menuBackdrop} 
            onPress={closePlanMenu}
          />
          <View style={styles.planMenuContainer}>
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
      {currentIndex < plans.length && !(screens[currentIndex] as any).isCreateScreen && (
        <PlanUsersDialog
          visible={showPlanUsersDialog}
          plan={plans[currentIndex].plan}
          tasks={plans[currentIndex].tasks}
          onClose={() => setShowPlanUsersDialog(false)}
          onUpdate={handlePlanUpdate}
        />
      )}
    </View>
  );
}

function TaskTree({ plan, tasks }: { plan: Plan; tasks: Task[] }) {
  // build quick lookup
  const byId = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  // find roots (children of plan)
  const roots = tasks.filter((t) => t.parentId === plan.id);

  return (
    <View style={{ paddingHorizontal: 12 }}>
      {roots.map((r) => (
        <TaskNode key={r.id} id={r.id} byId={byId} level={0} />
      ))}
    </View>
  );
}

function TaskNode({ id, byId, level }: { id: string; byId: Map<string, Task>; level: number }) {
  const task = byId.get(id)!;
  const [open, setOpen] = useState<boolean>(false);
  const children = task.subtaskIds ?? [];

  return (
    <View style={{ marginVertical: 8 }}>
      <Pressable
        onPress={() => setOpen((s) => !s)}
        style={[styles.nodeRow, { paddingLeft: level * 14 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
      >
        <Text style={styles.nodeTitle}>{open ? '▾' : '▸'} {task.title}</Text>
        <Text style={styles.nodeStatus}>{task.status}</Text>
      </Pressable>
      {open && (
        <View>
          <View style={{ paddingLeft: 14, paddingVertical: 6 }}>
              <Text style={styles.nodeMeta}>id: {task.id}</Text>
              {task.description ? <Text style={styles.nodeMeta}>{task.description}</Text> : null}
            </View>
          {children.map((c) => (
            <TaskNode key={c} id={c} byId={byId} level={level + 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  
  floatingHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  loadingText: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 100 
  },
  
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  refreshButton: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  refreshText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // Hamburger Menu styles
  hamburgerButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 6,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 60,
    left: 0,
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    marginLeft: 8,
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

  // Plan Context Menu styles
  contextMenuButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
  },
  contextMenuIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '700',
    lineHeight: 24,
  },
  planMenuContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 60,
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

  errorBanner: {
    backgroundColor: '#fff3cd',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { fontSize: 12, color: '#856404' },
  localBadge: { 
    color: 'white', 
    backgroundColor: 'crimson', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '700'
  },

  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Create Plan Screen styles
  createPlanScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    width: '100%'
  },
  createPlanIcon: {
    fontSize: 80,
    color: '#007AFF',
    marginBottom: 16
  },
  createPlanText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600'
  },

  // Plan Screen styles
  planScreen: {
    flex: 1,
    width: '100%',
    paddingTop: 156,
    backgroundColor: '#fff'
  },
  planHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingBottom: 12
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    padding: 4,
    marginLeft: 8,
  },
  editIconText: {
    fontSize: 24,
  },
  deleteIcon: {
    padding: 4,
    marginLeft: 4,
  },
  deleteIconText: {
    fontSize: 28,
    color: '#ff3b30',
    fontWeight: '700',
  },
  planHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  planHeaderSubtitle: {
    fontSize: 16,
    color: '#666'
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16
  },
  planActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  planActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  tasksContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40
  },
  planButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  planButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },

  // Modal styles
  modalContainer: { flex: 1, padding: 12, backgroundColor: '#fff' },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 8, borderRadius: 6, backgroundColor: '#eee' },
  closeText: { fontWeight: '600' },
  modalBody: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  jsonBox: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginBottom: 16 },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#222' },
  
  // Task tree styles
  nodeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingRight: 8 
  },
  nodeTitle: { fontSize: 15, lineHeight: 20, flex: 1 },
  nodeStatus: { fontSize: 12, color: '#666', marginLeft: 8 },
  nodeMeta: { fontSize: 12, color: '#444', marginBottom: 4 },
  
  // Assignee pill styles
  assigneePillContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  assigneePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  assigneePillUnassigned: {
    backgroundColor: '#f0f0f0',
  },
  assigneePillText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  assigneePillTextUnassigned: {
    color: '#666',
  },
});
