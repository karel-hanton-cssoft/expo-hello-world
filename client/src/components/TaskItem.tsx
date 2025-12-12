import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../models/task';
import { User } from '../models/user';

export interface TaskItemProps {
  task: Task;
  allTasks: Map<string, Task>;
  planUsers: Record<string, User>;
  onAddSubtask: (parentTaskId: string) => void;
  onViewDetails: (taskId: string) => void;
  onDelete: (taskId: string) => void | Promise<void>;
  level?: number;
}

/**
 * Recursive Task UI component.
 * Displays task with title, description, and nested subtasks.
 */
export default function TaskItem({
  task,
  allTasks,
  planUsers,
  onAddSubtask,
  onViewDetails,
  onDelete,
  level = 0,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);

  // Get direct subtasks for this task
  const directSubtasks = Array.from(allTasks.values()).filter(t => 
    task.subtaskIds?.includes(t.id)
  );

  return (
    <View style={[styles.container, { marginLeft: level * 20 }]}>
      {/* Blue vertical line */}
      <View style={styles.blueLine} />

      {/* Task content */}
      <View style={styles.content}>
        {/* Title with edit icon - tappable to expand/collapse */}
        <View style={styles.titleRow}>
          <TouchableOpacity 
            onPress={() => setExpanded(!expanded)}
            style={{ flex: 1 }}
          >
            <Text style={styles.title}>
              {expanded ? '▼' : '▶'} {task.title}
            </Text>
          </TouchableOpacity>
          <View style={styles.iconButtons}>
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => onViewDetails(task.id)}
            >
              <Text style={styles.editIconText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => onDelete(task.id)}
            >
              <Text style={styles.deleteIconText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assignee Pill */}
        {expanded && (
          <View style={styles.assigneePillContainer}>
            {task.assigneeId && planUsers && planUsers[task.assigneeId] ? (
              <View style={styles.assigneePill}>
                <Text style={styles.assigneePillText}>
                  {planUsers[task.assigneeId].displayName}
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
        )}

        {/* Description */}
        {task.description && expanded && (
          <Text style={styles.description}>{task.description}</Text>
        )}

        {/* Action buttons */}
        {expanded && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => onViewDetails(task.id)}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => onAddSubtask(task.id)}
            >
              <Text style={styles.buttonText}>+ SubTask</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nested subtasks (recursive) */}
        {expanded && directSubtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            {directSubtasks.map(subtask => (
              <TaskItem
                key={subtask.id}
                task={subtask}
                allTasks={allTasks}
                planUsers={planUsers}
                onAddSubtask={onAddSubtask}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  blueLine: {
    width: 3,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  editIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  editIconText: {
    fontSize: 18,
  },
  deleteIconButton: {
    padding: 4,
    marginLeft: 4,
  },
  deleteIconText: {
    fontSize: 20,
    color: '#ff3b30',
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
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
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  subtasksContainer: {
    marginTop: 8,
  },
});
