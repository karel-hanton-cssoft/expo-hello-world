# User Dialog

## Overview
Univerzální dialog pro správu uživatelských údajů v aplikaci. Používá se ve dvou kontextech:
1. **Global Menu**: Editace App Default User (výchozí uživatel aplikace)
2. **Plan Context Menu**: Management Plan Users (vytváření a editace uživatelů v plánu)

## UI Specification

### Dialog Type
- **Typ**: Full-screen Modal s vlastním headerem
- **Animace**: Slide up from bottom (standardní React Native Modal)
- **Backdrop**: Neprůhledný (full modal)

### Dialog Header
```
[← Back]  [User Settings]  [Save]
```

- **Back button**: Zavře dialog bez uložení
- **Title**: "User Settings" nebo "Edit Default User" nebo "New Plan User"
- **Save button**: Uloží změny a zavře dialog

### Dialog Layout
```
┌─────────────────────────────┐
│ [← Back] User Settings [Save]│
├─────────────────────────────┤
│                              │
│  Display Name *              │
│  ┌─────────────────────────┐│
│  │ Alice                   ││
│  └─────────────────────────┘│
│                              │
│  First Name                  │
│  ┌─────────────────────────┐│
│  │ Alice                   ││
│  └─────────────────────────┘│
│                              │
│  Last Name                   │
│  ┌─────────────────────────┐│
│  │ Johnson                 ││
│  └─────────────────────────┘│
│                              │
│  Email                       │
│  ┌─────────────────────────┐│
│  │ alice@example.com       ││
│  └─────────────────────────┘│
│                              │
│  Phone Number                │
│  ┌─────────────────────────┐│
│  │ +420 777 123 456        ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │ 📱 Import from Contacts ││
│  └─────────────────────────┘│
│                              │
└─────────────────────────────┘
```

## Form Fields

### Required Fields
- **Display Name**: Povinné pole (*)
  - Label: "Display Name *"
  - Placeholder: "Enter display name"
  - Validace: Minimálně 1 znak
  - Používá se jako primární zobrazovaný název v UI

### Optional Fields
- **First Name**: Volitelné
  - Label: "First Name"
  - Placeholder: "Enter first name"
  
- **Last Name**: Volitelné
  - Label: "Last Name"
  - Placeholder: "Enter last name"
  
- **Email**: Volitelné
  - Label: "Email"
  - Placeholder: "Enter email address"
  - Validace: Email formát (pokud vyplněno)
  - Keyboard type: 'email-address'
  
- **Phone Number**: Volitelné
  - Label: "Phone Number"
  - Placeholder: "Enter phone number"
  - Keyboard type: 'phone-pad'

## Import from Contacts

### Button Design
- **Umístění**: Pod všemi input poli
- **Ikona**: ikona "contacts" (silueta horní části postavy jako má Adnroid)
- **Text**: "Import from Contacts"
- **Styl**: Sekundární button (outline nebo light background)
- **Šířka**: Full width

### Behavior
1. Kliknutí na button otevře native kontakty
2. Uživatel vybere kontakt z telefonního seznamu
3. Dialog předvyplní pole z vybraného kontaktu:
   - Display Name → z contact.name nebo contact.displayName
   - First Name → z contact.givenName
   - Last Name → z contact.familyName
   - Email → z contact.emails[0]
   - Phone Number → z contact.phoneNumbers[0]
4. Uživatel může upravit importovaná data před uložením

### Technical Implementation
Použití `expo-contacts`:
```typescript
import * as Contacts from 'expo-contacts';

const handleImportContact = async () => {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission denied', 'Cannot access contacts');
    return;
  }
  
  // Open contact picker
  const contact = await Contacts.presentContactPickerAsync();
  if (contact) {
    setDisplayName(contact.name || '');
    setFirstName(contact.givenName || '');
    setLastName(contact.familyName || '');
    setEmail(contact.emails?.[0]?.email || '');
    setPhoneNumber(contact.phoneNumbers?.[0]?.number || '');
  }
};
```

## Usage Contexts

### 1. Global Menu - Edit Default User

**Volání z Global Menu**:
```typescript
const openDefaultUserDialog = async () => {
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
};
```

**Save akce**:
- Uloží do AsyncStorage jako Default User
- Použije se pro nové plány jako výchozí assignee
- Klíč: 'defaultUser'

**Note:** Default User se nevytváří (Aplikace má vždy výchozí) ani nejde mazat.

### 2. Plan Context Menu - Manage Plan Users

**Vytvoření nového Plan User**:
```typescript
const openCreatePlanUserDialog = () => {
  setUserDialogMode('createPlanUser');
  setCurrentPlanId(plan.id);
  setUserDialogInitialValues({
    displayName: '',
    // ostatní prázdné
  });
  setShowUserDialog(true);
};
```

**Editace existujícího Plan User**:
```typescript
const openEditPlanUserDialog = (userId: string) => {
  const user = plan.users[userId];
  setUserDialogMode('editPlanUser');
  setCurrentPlanId(plan.id);
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
```

**Save akce**:
- Přidá/upraví uživatele v plan.users
- Vygeneruje userId (např. 'user-{timestamp}')
- Synchronizuje se serverem přes PATCH /tasks/{id}


## State Management

### Dialog State
```typescript
const [showUserDialog, setShowUserDialog] = useState(false);
const [userDialogMode, setUserDialogMode] = useState<'editDefault' | 'createPlanUser' | 'editPlanUser'>('editDefault');
const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [userDialogInitialValues, setUserDialogInitialValues] = useState<Partial<User> | undefined>(undefined);
```

### Form State
```typescript
const [displayName, setDisplayName] = useState('');
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');
const [phoneNumber, setPhoneNumber] = useState('');
```

## Component Props

```typescript
interface UserDialogProps {
  visible: boolean;
  mode: 'editDefault' | 'createPlanUser' | 'editPlanUser';
  initialValues?: Partial<User>;
  onCancel: () => void;
  onSave: (user: Partial<User>) => void;
}
```

## Validation

### On Save
1. **Display Name**: Povinné
   - Pokud prázdné → zobrazit error "Display Name is required"
   - Alert nebo text pod polem s červenou barvou

2. **Email**: Validace formátu (pokud vyplněno)
   - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Pokud nevalidní → "Please enter a valid email address"

3. **Phone Number**: Žádná validace formátu (různé mezinárodní formáty)

### Error Display
```tsx
{displayNameError && (
  <Text style={styles.errorText}>{displayNameError}</Text>
)}
```

## Styling

### Modal Container
```typescript
modalContainer: {
  flex: 1,
  backgroundColor: '#fff',
}
```

### Header
```typescript
modalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  backgroundColor: '#f9f9f9',
}
```

### Form Container
```typescript
formContainer: {
  padding: 16,
}
```

### Input Group
```typescript
inputGroup: {
  marginBottom: 20,
}
```

### Label
```typescript
label: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 8,
}
```

### Required Indicator
```typescript
requiredIndicator: {
  color: '#ff3b30',
}
```

### Text Input
```typescript
input: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  backgroundColor: '#fff',
}
```

### Import Button
```typescript
importButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 14,
  borderWidth: 1,
  borderColor: '#007AFF',
  borderRadius: 8,
  marginTop: 8,
  backgroundColor: '#f0f8ff',
}
```

### Error Text
```typescript
errorText: {
  color: '#ff3b30',
  fontSize: 12,
  marginTop: 4,
}
```

## Save Flow

### For 'editDefault' mode
```typescript
const handleSave = async () => {
  if (!displayName.trim()) {
    setDisplayNameError('Display Name is required');
    return;
  }
  
  const user: User = {
    displayName: displayName.trim(),
    firstName: firstName?.trim(),
    lastName: lastName?.trim(),
    email: email?.trim(),
    phoneNumber: phoneNumber?.trim(),
  };
  
  await saveDefaultUser(user);
  onSave(user);
  closeDialog();
};
```

### For 'createPlanUser' mode
```typescript
const handleSave = async () => {
  if (!displayName.trim()) {
    setDisplayNameError('Display Name is required');
    return;
  }
  
  const userId = `user-${Date.now()}`;
  const user: User = {
    displayName: displayName.trim(),
    firstName: firstName?.trim(),
    lastName: lastName?.trim(),
    email: email?.trim(),
    phoneNumber: phoneNumber?.trim(),
  };
  
  // Add to plan.users
  const updatedPlan = {
    ...currentPlan,
    users: {
      ...currentPlan.users,
      [userId]: user,
    },
  };
  
  await patchPlan(currentPlanId, { users: updatedPlan.users });
  onSave(user);
  closeDialog();
};
```

### For 'editPlanUser' mode
```typescript
const handleSave = async () => {
  if (!displayName.trim()) {
    setDisplayNameError('Display Name is required');
    return;
  }
  
  const user: User = {
    displayName: displayName.trim(),
    firstName: firstName?.trim(),
    lastName: lastName?.trim(),
    email: email?.trim(),
    phoneNumber: phoneNumber?.trim(),
  };
  
  // Update in plan.users
  const updatedPlan = {
    ...currentPlan,
    users: {
      ...currentPlan.users,
      [currentUserId]: user,
    },
  };
  
  await patchPlan(currentPlanId, { users: updatedPlan.users });
  onSave(user);
  closeDialog();
};
```

## Related Components
- **GlobalMenu**: Volá UserDialog pro editaci Default User
- **Plan Context Menu** (budoucí): Volá UserDialog pro management Plan Users

## Related Use Cases
- Budoucí UC-XX: Edit Default User
- Budoucí UC-XX: Create Plan User
- Budoucí UC-XX: Edit Plan User

## Dependencies
- `expo-contacts`: Pro import z telefonních kontaktů
  ```bash
  npx expo install expo-contacts
  ```

## Accessibility
- Všechna pole mají jasné labely
- Required pole označeno hvězdičkou (*)
- Error messages jsou jasné a akční
- Velké touch targets pro tlačítka
- Native keyboard types pro email a telefon

## Testing Considerations
- Testovat import z kontaktů na iOS i Android
- Ověřit permission handling pro kontakty
- Testovat validaci email formátu
- Ověřit správné předvyplnění hodnot
- Testovat ukládání do AsyncStorage (default user)
- Testovat synchronizaci se serverem (plan users)
