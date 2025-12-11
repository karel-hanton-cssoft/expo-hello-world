# Plan Users Management Dialog

## Overview
Dialog pro správu uživatelů konkrétního plánu. Umožňuje prohlížet seznam uživatelů plánu a provádět operace Add, Edit a Delete s validací závislostí.

## UI Specification

### Dialog Type
- **Typ**: Full-screen Modal s vlastním headerem
- **Animace**: Slide up from bottom (standardní React Native Modal)
- **Backdrop**: Neprůhledný (full modal)

### Dialog Header
```
[← Back]  [Plan Users]  [+ Add]
```

- **Back button**: Zavře dialog a vrátí se na plán
- **Title**: "Plan Users" nebo "Users - [Plan Name]"
- **Add button**: Otevře UserDialog pro vytvoření nového uživatele

### Dialog Layout
```
┌─────────────────────────────┐
│ [← Back]  Plan Users  [+ Add]│
├─────────────────────────────┤
│                              │
│  👤 Alice (Author)           │
│      alice@example.com       │
│      [Edit] [Delete]         │
│  ────────────────────────    │
│                              │
│  👤 Bob                      │
│      bob@example.com         │
│      [Edit] [Delete]         │
│  ────────────────────────    │
│                              │
│  👤 Charlie Smith            │
│      No email                │
│      [Edit] [Delete]         │
│  ────────────────────────    │
│                              │
└─────────────────────────────┘
```

## User List Display

### User Item Structure
Každý uživatel má:
- **Avatar/Icon**: 👤 nebo iniciály
- **Display Name**: Hlavní název (povinné pole)
- **Badge**: "(Author)" pro autora plánu
- **Secondary Info**: Email nebo telefon (první dostupné)
- **Actions**: Edit a Delete tlačítka

### User Item Layout
```typescript
<View style={styles.userItem}>
  <View style={styles.userAvatar}>
    <Text style={styles.avatarText}>👤</Text>
  </View>
  
  <View style={styles.userInfo}>
    <View style={styles.userNameRow}>
      <Text style={styles.userName}>{user.displayName}</Text>
      {isAuthor && <Text style={styles.authorBadge}>(Author)</Text>}
    </View>
    
    <Text style={styles.userSecondary}>
      {user.email || user.phoneNumber || 'No contact info'}
    </Text>
  </View>
  
  <View style={styles.userActions}>
    <Pressable onPress={() => handleEditUser(userId)} style={styles.actionButton}>
      <Text style={styles.actionIcon}>✏️</Text>
    </Pressable>
    
    <Pressable 
      onPress={() => handleDeleteUser(userId)} 
      style={[styles.actionButton, styles.deleteButton]}
      disabled={!canDeleteUser(userId)}
    >
      <Text style={[
        styles.actionIcon, 
        !canDeleteUser(userId) && styles.actionDisabled
      ]}>✕</Text>
    </Pressable>
  </View>
</View>
```

## User Management Operations

### 1. Add User

**Flow:**
1. User klikne na "+ Add" v headeru
2. Otevře se UserDialog v režimu 'createPlanUser'
3. User vyplní údaje (displayName povinný)
4. Možnost importu z kontaktů
5. Po Save:
   - Vygeneruje se userId: `user-{timestamp}` nebo UUID
   - User se přidá do `plan.users[userId]`
   - Synchronizace se serverem: `PATCH /tasks/{planId}` s `users` objektem
   - Dialog se zavře a seznam se obnoví

**Validace:**
- displayName je povinné
- Email musí mít validní formát (pokud vyplněno)

### 2. Edit User

**Flow:**
1. User klikne na "✏️" u konkrétního uživatele
2. Otevře se UserDialog v režimu 'editPlanUser' s předvyplněnými údaji
3. User upraví údaje
4. Po Save:
   - Aktualizuje se `plan.users[userId]`
   - Synchronizace se serverem: `PATCH /tasks/{planId}`
   - Dialog se zavře a seznam se obnoví

**Validace:**
- Stejná jako u Add User

**Poznámka:**
- Lze editovat jakéhokoli uživatele včetně autora
- Nelze změnit userId (je klíčem v dictionary)

### 3. Delete User

**Flow:**
1. User klikne na "✕" u konkrétního uživatele
2. **VALIDACE ZÁVISLOSTÍ** (nejdůležitější část):
   ```typescript
   function canDeleteUser(userId: string): boolean {
     // Check if user is the plan author
     if (plan.authorId === userId) {
       return false; // Author cannot be deleted
     }
     
     // Check if user is assigned to the plan itself
     if (plan.assigneeId === userId) {
       return false;
     }
     
     // Check if user is assigned to any task in the plan
     const isUsedInTasks = plan.tasks.some(task => 
       task.authorId === userId || task.assigneeId === userId
     );
     
     if (isUsedInTasks) {
       return false;
     }
     
     // User can be safely deleted
     return true;
   }
   ```

3. Pokud `canDeleteUser(userId) === false`:
   - Delete button je disabled (šedý, neaktivní)
   - Při pokusu o kliknutí → Alert s vysvětlením
   
4. Pokud `canDeleteUser(userId) === true`:
   - Zobrazí se confirmation dialog:
     ```
     Delete User?
     Are you sure you want to remove [Display Name] from this plan?
     This action cannot be undone.
     [Cancel] [Delete]
     ```

5. Po potvrzení:
   - Smaže se `plan.users[userId]`
   - Synchronizace se serverem: `PATCH /tasks/{planId}`
   - Seznam se obnoví

**Error Messages:**
- **Author cannot be deleted:**
  ```
  Cannot Delete Author
  The plan author cannot be removed from the plan.
  ```

- **User assigned to plan:**
  ```
  Cannot Delete User
  [Display Name] is assigned to this plan. Please reassign the plan before deleting this user.
  ```

- **User assigned to tasks:**
  ```
  Cannot Delete User
  [Display Name] is assigned to one or more tasks in this plan. Please reassign all tasks before deleting this user.
  ```

## Component Props

```typescript
interface PlanUsersDialogProps {
  visible: boolean;
  plan: Plan;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (updatedPlan: Plan) => void;
}
```

## State Management

### Dialog State
```typescript
const [showUserDialog, setShowUserDialog] = useState(false);
const [userDialogMode, setUserDialogMode] = useState<'createPlanUser' | 'editPlanUser'>('createPlanUser');
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [userDialogInitialValues, setUserDialogInitialValues] = useState<Partial<User> | undefined>(undefined);
```

### User List State
```typescript
// Users jsou získáni z plan.users
const usersList = Object.entries(plan.users).map(([userId, user]) => ({
  id: userId,
  ...user,
}));

// Sort: Author first, pak alfabeticky
const sortedUsers = usersList.sort((a, b) => {
  if (a.id === plan.authorId) return -1;
  if (b.id === plan.authorId) return 1;
  return a.displayName.localeCompare(b.displayName);
});
```

## Add User Flow

```typescript
const handleAddUser = () => {
  setUserDialogMode('createPlanUser');
  setCurrentUserId(null);
  setUserDialogInitialValues({
    displayName: '',
  });
  setShowUserDialog(true);
};

const handleSaveNewUser = async (user: Partial<User>) => {
  try {
    const userId = `user-${Date.now()}`; // nebo UUID
    
    const updatedPlan = {
      ...plan,
      users: {
        ...plan.users,
        [userId]: user as User,
      },
    };
    
    // Sync to server
    await patchTask(plan.id, { users: updatedPlan.users });
    
    // Update parent
    onUpdate(updatedPlan);
    
    setShowUserDialog(false);
  } catch (err) {
    console.error('Failed to add user', err);
    Alert.alert('Error', 'Failed to add user');
  }
};
```

## Edit User Flow

```typescript
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
    await patchTask(plan.id, { users: updatedPlan.users });
    
    // Update parent
    onUpdate(updatedPlan);
    
    setShowUserDialog(false);
  } catch (err) {
    console.error('Failed to update user', err);
    Alert.alert('Error', 'Failed to update user');
  }
};
```

## Delete User Flow

```typescript
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
  const isUsedInTasks = tasks.some(task => 
    task.authorId === userId || task.assigneeId === userId
  );
  
  return !isUsedInTasks;
};

const getDeleteDisabledReason = (userId: string): string | null => {
  if (plan.authorId === userId) {
    return 'The plan author cannot be removed from the plan.';
  }
  
  if (plan.assigneeId === userId) {
    return `${plan.users[userId].displayName} is assigned to this plan. Please reassign the plan before deleting this user.`;
  }
  
  const isUsedInTasks = tasks.some(task => 
    task.authorId === userId || task.assigneeId === userId
  );
  
  if (isUsedInTasks) {
    return `${plan.users[userId].displayName} is assigned to one or more tasks. Please reassign all tasks before deleting this user.`;
  }
  
  return null;
};

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
            await patchTask(plan.id, { users: updatedPlan.users });
            
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
```

## Styling

### User Item
```typescript
userItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  backgroundColor: '#fff',
}
```

### User Avatar
```typescript
userAvatar: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#007AFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
}

avatarText: {
  fontSize: 24,
}
```

### User Info
```typescript
userInfo: {
  flex: 1,
}

userNameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4,
}

userName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
}

authorBadge: {
  fontSize: 12,
  color: '#007AFF',
  fontWeight: '600',
  marginLeft: 8,
}

userSecondary: {
  fontSize: 14,
  color: '#666',
}
```

### User Actions
```typescript
userActions: {
  flexDirection: 'row',
  gap: 8,
}

actionButton: {
  padding: 8,
  borderRadius: 6,
  backgroundColor: '#f0f0f0',
}

deleteButton: {
  backgroundColor: '#ffebee',
}

actionIcon: {
  fontSize: 18,
}

actionDisabled: {
  opacity: 0.3,
}
```

## Empty State

Pokud by `plan.users` bylo prázdné (nemělo by nastat):
```tsx
{Object.keys(plan.users).length === 0 ? (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>👥</Text>
    <Text style={styles.emptyText}>No users in this plan</Text>
    <Text style={styles.emptySubtext}>Add users to collaborate</Text>
  </View>
) : (
  // User list
)}
```

## Related Components
- **UserDialog**: Používáno pro Add a Edit operace
- **Plan Context Menu**: Otevírá tento dialog

## Related Use Cases
- Budoucí UC-XX: Add Plan User
- Budoucí UC-XX: Edit Plan User
- Budoucí UC-XX: Delete Plan User

## Accessibility
- Jasné vizuální indikace pro disabled actions
- Informativní error messages
- Confirmation dialogs pro destruktivní akce
- Velké touch targets pro tlačítka
- Author badge pro jasnou identifikaci

## Testing Considerations
- Testovat nemožnost smazání autora
- Testovat nemožnost smazání assignee
- Testovat nemožnost smazání uživatele přiřazeného k tasku
- Testovat úspěšné smazání nepoužitého uživatele
- Testovat add a edit operations
- Ověřit synchronizaci se serverem
- Testovat zobrazení při žádných/mnoha uživatelích
- Testovat různé kombinace vyplněných polí (email/phone/none)
