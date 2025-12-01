import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import EXAMPLE_PLANS from './data/examples';
import * as api from './api';
import type { Task, Plan } from './models';

type ExamplePlan = { plan: Plan; tasks: Task[] };

export default function App() {
  const [selected, setSelected] = useState<ExamplePlan | null>(null);
  const [plans, setPlans] = useState<ExamplePlan[]>(EXAMPLE_PLANS as ExamplePlan[]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Developer — Example Plans</Text>
      <View style={styles.headerRow}>
        <Text style={styles.body}>Tap a plan to inspect its tasks.</Text>
        <Pressable onPress={async () => { setLoading(true); setError(null); try { const tasks = await api.fetchAllTasks(1000); setPlans(api.groupIntoPlans(tasks) as ExamplePlan[]); } catch (e: any) { setError(String(e?.message || e)); setPlans(EXAMPLE_PLANS as ExamplePlan[]); } finally { setLoading(false); } }} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading plans...</Text>
        ) : error ? (
          <View style={{ padding: 12 }}>
            <Text style={{ color: 'crimson' }}>Failed to load remote plans: {error}</Text>
            <Text style={{ marginTop: 8 }}>Showing local examples instead.</Text>
            <Text style={styles.localBadge}>LOCAL</Text>
          </View>
        ) : null}

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 32 }}>
          {plans.map((ex: any, idx: number) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.planButton, pressed && styles.planButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Open plan ${ex.plan.title}`}
              onPress={() => handleOpen(ex)}
            >
              <Text style={styles.planTitle}>{ex.plan.title}</Text>
              <Text style={styles.planMeta}>{ex.plan.description}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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
    </SafeAreaView>
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
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  body: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 12 },

  list: { flex: 1, width: '100%' },
  planButton: { backgroundColor: '#f5f5f5', padding: 12, marginBottom: 8, borderRadius: 8 },
  planButtonPressed: { backgroundColor: '#e6e6e6' },
  planTitle: { fontWeight: '700', fontSize: 16 },
  planMeta: { fontSize: 12, color: '#666', marginTop: 4 },

  modalContainer: { flex: 1, padding: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 8, borderRadius: 6, backgroundColor: '#eee' },
  closeText: { fontWeight: '600' },
  modalBody: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  jsonBox: { backgroundColor: '#12121205', padding: 8, borderRadius: 6 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#222' },
  nodeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingRight: 8 },
  nodeTitle: { fontSize: 15, lineHeight: 20 },
  nodeStatus: { fontSize: 12, color: '#666' },
  nodeMeta: { fontSize: 12, color: '#444', marginBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  refreshButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  refreshText: { color: 'white', fontWeight: '700' },
  localBadge: { color: 'white', backgroundColor: 'crimson', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 8 },
});
