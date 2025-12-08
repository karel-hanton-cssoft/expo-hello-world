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
} from 'react-native';
import EXAMPLE_PLANS from './data/examples';
import * as api from './api';
import type { Task, Plan } from './models';

type ExamplePlan = { plan: Plan; tasks: Task[] };

const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function App() {
  const [selected, setSelected] = useState<ExamplePlan | null>(null);
  const [plans, setPlans] = useState<ExamplePlan[]>(EXAMPLE_PLANS as ExamplePlan[]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  function handleOpen(p: ExamplePlan) {
    setSelected(p);
  }

  function handleClose() {
    setSelected(null);
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tasks = await api.fetchAllTasks(1000);
        const grouped = api.groupIntoPlans(tasks);
        if (mounted) setPlans(grouped as ExamplePlan[]);
      } catch (err: any) {
        console.warn('Failed to fetch remote tasks, falling back to examples', err);
        setError(String(err?.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Create screens array: plans + Create Plan Screen
  const screens = [...plans, { isCreateScreen: true }];

  const renderScreen = ({ item, index }: { item: any; index: number }) => {
    if (item.isCreateScreen) {
      // Create Plan Screen
      return (
        <View style={[styles.screenContainer, { width: SCREEN_WIDTH }]}>
          <View style={styles.createPlanScreen}>
            <Text style={styles.createPlanIcon}>+</Text>
            <Text style={styles.createPlanText}>Create new Plan</Text>
          </View>
        </View>
      );
    }

    // Plan Screen
    const plan = item as ExamplePlan;
    return (
      <View style={[styles.screenContainer, { width: SCREEN_WIDTH }]}>
        <View style={styles.planScreen}>
          <View style={styles.planHeader}>
            <Text style={styles.planHeaderTitle}>{plan.plan.title}</Text>
            <Text style={styles.planHeaderSubtitle}>{plan.plan.description}</Text>
          </View>
          <Pressable
            style={styles.planButton}
            onPress={() => handleOpen(plan)}
          >
            <Text style={styles.planButtonText}>View Details</Text>
          </Pressable>
        </View>
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
          <Text style={styles.title}>Plans ({currentIndex + 1}/{screens.length})</Text>
          <Pressable
            onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                const tasks = await api.fetchAllTasks(1000);
                setPlans(api.groupIntoPlans(tasks) as ExamplePlan[]);
              } catch (e: any) {
                setError(String(e?.message || e));
                setPlans(EXAMPLE_PLANS as ExamplePlan[]);
              } finally {
                setLoading(false);
              }
            }}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Using local data</Text>
            <Text style={styles.localBadge}>LOCAL</Text>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderScreen}
        keyExtractor={(item, index) =>
          item.isCreateScreen ? 'create-screen' : item.plan.id
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
    paddingTop: 106,
    padding: 16,
    backgroundColor: '#fff'
  },
  planHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  planHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8
  },
  planHeaderSubtitle: {
    fontSize: 16,
    color: '#666'
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
});
