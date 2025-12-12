import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Plan } from '../models/plan';
import { Task } from '../models/task';
import { User } from '../models/user';
import TaskItem from './TaskItem';
import { TaskDialog } from './TaskDialog';

export interface PlanItemProps {
  plan: Plan;
  taskMap: Map<string, Task>;
  onSaveTask: (taskId: string, title: string, description?: string, assigneeId?: string) => Promise<void>;
  onCreateTask: (parentId: string, title: string, description?: string, assigneeId?: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDeletePlan: (planId: string) => void;
}

/**
 * PlanItem displays a single plan with its tasks.
 * Handles task dialog for editing plan and tasks.
 */
export default function PlanItem({
  plan,
  taskMap,
  onSaveTask,
  onCreateTask,
  onDeleteTask,
  onDeletePlan,
}: PlanItemProps) {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [taskParentId, setTaskParentId] = useState<string | null>(null);
  const [dialogInitialValues, setDialogInitialValues] = useState<{title?: string; description?: string; assigneeId?: string} | undefined>(undefined);

  // Find root tasks (direct children of plan)
  const rootTasks = Array.from(taskMap.values()).filter(t => t.parentId === plan.id);

  // Dialog handlers
  const handleEditPlan = () => {
    setDialogMode('edit');
    setEditTaskId(plan.id);
    setTaskParentId(null);
    setDialogInitialValues({
      title: plan.title,
      description: plan.description,
      assigneeId: plan.assigneeId,
    });
    setShowDialog(true);
  };

  const handleEditTask = (taskId: string) => {
    const task = taskMap.get(taskId);
    if (!task) return;
    
    setDialogMode('edit');
    setEditTaskId(taskId);
    setTaskParentId(null);
    setDialogInitialValues({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
    });
    setShowDialog(true);
  };

  const handleAddTask = (parentId: string) => {
    setDialogMode('create');
    setTaskParentId(parentId);
    setEditTaskId(null);
    setDialogInitialValues(undefined);
    setShowDialog(true);
  };

  const handleSave = async (title: string, description?: string, assigneeId?: string) => {
    if (dialogMode === 'edit' && editTaskId) {
      await onSaveTask(editTaskId, title, description, assigneeId);
    } else if (dialogMode === 'create' && taskParentId) {
      await onCreateTask(taskParentId, title, description, assigneeId);
    }
    setShowDialog(false);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    await onDeleteTask(taskId);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Plan Header */}
      <View style={styles.planHeader}>
        <View style={styles.planHeaderRow}>
          <Text style={styles.planHeaderTitle}>{plan.title}</Text>
          <View style={styles.iconButtons}>
            <Pressable 
              style={styles.editIcon}
              onPress={handleEditPlan}
            >
              <Text style={styles.editIconText}>✏️</Text>
            </Pressable>
            <Pressable 
              style={styles.deleteIcon}
              onPress={() => onDeletePlan(plan.id)}
            >
              <Text style={styles.deleteIconText}>✕</Text>
            </Pressable>
          </View>
        </View>
        {plan.description && (
          <Text style={styles.planHeaderSubtitle}>{plan.description}</Text>
        )}
        
        {/* Assignee Pill */}
        <View style={styles.assigneePillContainer}>
          {plan.assigneeId && plan.users && plan.users[plan.assigneeId] ? (
            <View style={styles.assigneePill}>
              <Text style={styles.assigneePillText}>
                {plan.users[plan.assigneeId].displayName}
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
        
        <View style={styles.blueLine} />
      </View>
      
      {/* Plan Actions */}
      <View style={styles.planActions}>
        <Pressable
          style={[styles.planActionButton, { backgroundColor: '#28a745' }]}
          onPress={() => handleAddTask(plan.id)}
        >
          <Text style={styles.planActionButtonText}>+ Add Task</Text>
        </Pressable>
      </View>
      
      {/* Tasks Container */}
      <View style={styles.tasksContainer}>
        {rootTasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet. Add your first task!</Text>
        ) : (
          rootTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              allTasks={taskMap}
              planUsers={plan.users || {}}
              onAddSubtask={handleAddTask}
              onViewDetails={handleEditTask}
              onDelete={handleDeleteTask}
              level={0}
            />
          ))
        )}
      </View>

      {/* Task Dialog */}
      <TaskDialog
        visible={showDialog}
        mode={dialogMode}
        type={editTaskId === plan.id ? 'plan' : 'task'}
        users={plan.users || {}}
        initialValues={dialogInitialValues}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 156,
  },
  
  planHeader: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  planHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  
  planHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  
  iconButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  editIcon: {
    padding: 4,
  },
  
  editIconText: {
    fontSize: 18,
  },
  
  deleteIcon: {
    padding: 4,
  },
  
  deleteIconText: {
    fontSize: 20,
    color: '#dc3545',
    fontWeight: '600',
  },
  
  assigneePillContainer: {
    marginTop: 8,
  },
  
  assigneePill: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  
  assigneePillUnassigned: {
    backgroundColor: '#e0e0e0',
  },
  
  assigneePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  assigneePillTextUnassigned: {
    color: '#666',
  },
  
  blueLine: {
    height: 3,
    backgroundColor: '#007AFF',
    marginTop: 12,
  },
  
  planActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  
  planActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  planActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  tasksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 24,
    fontStyle: 'italic',
  },
});
