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
  const [expanded, setExpanded] = useState<boolean>(true); // Collapse/expand state

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
      {/* Plan Header - rendered as TaskItem with isPlan={true} */}
      <TaskItem
        task={plan}
        allTasks={taskMap}
        planUsers={plan.users || {}}
        isPlan={true}
        onAddSubtask={handleAddTask}
        onViewDetails={handleEditPlan}
        onDelete={() => onDeletePlan(plan.id)}
        level={0}
      />
      
      {/* Tasks Container */}
      {expanded && (
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
      )}

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
