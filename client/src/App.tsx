import React, { useState, useRef } from 'react';
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
import PlanItem from './components/PlanItem';
import PlanScreen, { ExamplePlan } from './components/PlanScreen';
import AboutDialog from './components/AboutDialog';
import UserDialog from './components/UserDialog';
import PlanUsersDialog from './components/PlanUsersDialog';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function App() {
  const [selected, setSelected] = useState<ExamplePlan | null>(null);
  const [plans, setPlans] = useState<ExamplePlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showPlanDialog, setShowPlanDialog] = useState<boolean>(false);
  const [planDialogInitialValues, setPlanDialogInitialValues] = useState<{title?: string; description?: string} | undefined>(undefined);
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

  const handlePlanUpdate = (planId: string, updatedData: Partial<ExamplePlan>) => {
    setPlans(prevPlans => 
      prevPlans.map(p => 
        p.plan.id === planId ? { ...p, ...updatedData } : p
      )
    );
  };

  const handlePlanUpdateFromDialog = (updatedPlan: Plan) => {
    // Called from PlanUsersDialog - update only the plan object
    setPlans(prevPlans => 
      prevPlans.map(p => 
        p.plan.id === updatedPlan.id ? { ...p, plan: updatedPlan } : p
      )
    );
  };

  const openCreatePlanDialog = async () => {
    setPlanDialogInitialValues(undefined);
    
    // Load default user for assignee selection
    try {
      const defaultUser = await getDefaultUser();
      const tempUserId = 'user-1';
      setDefaultUserForDialog({ [tempUserId]: defaultUser });
    } catch (err) {
      console.warn('Failed to load default user for dialog', err);
      setDefaultUserForDialog({});
    }
    
    setShowPlanDialog(true);
  };

  const closePlanDialog = () => {
    setShowPlanDialog(false);
    setPlanDialogInitialValues(undefined);
    setDefaultUserForDialog({});
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const planData = plans.find(p => p.plan.id === planId);
      if (!planData) {
        Alert.alert('Error', 'Plan not found');
        return;
      }

      const taskCount = planData.taskMap.size + 1; // +1 for plan itself

      Alert.alert(
        'Delete Confirmation',
        `Delete this plan and all ${taskCount} task(s)? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete plan + all tasks from server
                await api.deleteTask(planId).catch(err => {
                  console.warn(`Failed to delete plan ${planId} from server:`, err);
                });
                
                // Delete plan from AsyncStorage
                await removePlan(planId);

                // Remove plan from local state
                setPlans(prev => prev.filter(p => p.plan.id !== planId));

                // Navigate away from deleted plan
                setTimeout(() => {
                  if (currentIndex > 0) {
                    flatListRef.current?.scrollToIndex({
                      index: Math.max(0, currentIndex - 1),
                      animated: true,
                    });
                  }
                }, 100);

                Alert.alert('Success', `Deleted plan and ${taskCount} task(s)`);
              } catch (err: any) {
                console.error('Failed to delete plan:', err);
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

  const handleSavePlan = async (title: string, description?: string, assigneeId?: string) => {
    try {
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
    } catch (err: any) {
      console.error('Failed to save plan', err);
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
        taskMap: new Map<string, Task>(),
        lastUpdateTimestamp: Date.now(), // Just created
        isRefreshing: false,
      };
      setPlans(prev => [...prev, newExamplePlan]);

      // Close dialog
      closePlanDialog();

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
          taskMap: new Map<string, Task>(),
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
    const planData = item as ExamplePlan;
    
    return (
      <PlanScreen
        planData={planData}
        screenIndex={index}
        isVisible={index === currentIndex}
        onUpdatePlan={handlePlanUpdate}
        onDeletePlan={handleDeletePlan}
        onShowError={setError}
      />
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
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
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

              <Text style={styles.sectionTitle}>Tasks (raw)</Text>
              <View style={styles.jsonBox}>
                <Text style={styles.mono}>{JSON.stringify(Array.from(selected.taskMap.values()), null, 2)}</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Plan Dialog (Create Plan only) */}
      <TaskDialog
        visible={showPlanDialog}
        mode="create"
        type="plan"
        users={defaultUserForDialog}
        initialValues={planDialogInitialValues}
        onCancel={closePlanDialog}
        onSave={handleSavePlan}
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
          tasks={Array.from(plans[currentIndex].taskMap.values())}
          onClose={() => setShowPlanUsersDialog(false)}
          onUpdate={handlePlanUpdateFromDialog}
        />
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
});
