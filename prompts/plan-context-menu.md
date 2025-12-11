# Plan Context Menu

## Overview
Kontextové menu pro aktuálně zobrazený plán. Poskytuje přístup k funkcím specifickým pro daný plán, zejména správu uživatelů a další plánové operace.

## UI Specification

### Position & Layout
- **Umístění**: Pravý horní roh floatingHeader, za tlačítkem "Refresh"
- **Ikona**: Context menu (⋮ - tři tečky pod sebou)
- **Styl ikony**:
  - Velikost: 24px
  - Barva: #333 (dark gray)
  - Padding: 8px pro větší touch target
  - Pressable pro vizuální feedback

### Menu Type
- **Typ**: Pull-Down menu (rozbalovací nabídka)
- **Animace**: Smooth slide-down s fade-in efektem
- **Pozice menu**: Pod context menu ikonou, zarovnáno vpravo
- **Overlay**: Poloprůhledný backdrop (#00000080) pokrývající celou obrazovku
- **Close**: Kliknutí mimo menu nebo na backdrop zavře menu

### Menu Container
- **Šířka**: 280px (nebo 75% šířky obrazovky, maximálně 320px)
- **Pozice**: Absolute, top: 60px (pod headerem), right: 0
- **Pozadí**: Bílé (#ffffff)
- **Shadow**: Výrazný stín pro floating efekt
  - shadowColor: '#000'
  - shadowOffset: { width: -2, height: 2 }
  - shadowOpacity: 0.25
  - shadowRadius: 8
  - elevation: 10 (Android)
- **Border radius**: 8px 0 8px 8px (zaoblené levé a dolní rohy)

## Visibility & Context

### Display Logic
- **Zobrazeno pouze**: Když je otevřen konkrétní Plan Screen
- **Skryto**: Na "Create Plan" screen (poslední screen v horizontálním scrollu)
- **Context**: Menu operuje vždy s aktuálně zobrazeným plánem
  - Získáno z `currentIndex` a `plans[currentIndex]`

### State Management
```typescript
const [planMenuVisible, setPlanMenuVisible] = useState(false);
const currentPlan = plans[currentIndex]; // Získání aktuálního plánu

// Zobrazit tlačítko pouze pokud existuje plán
const showPlanMenu = currentIndex < plans.length && !plans[currentIndex].isCreateScreen;
```

## Menu Items

### Structure
Každá položka menu má:
- **Icon**: Emoji nebo Material Icons (levá strana)
- **Label**: Text popisující funkci
- **Divider**: Jemná čára (#e0e0e0) mezi položkami (kromě poslední)

### Menu Item Styling
```typescript
{
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0'
}
```

### Current Menu Items

#### 1. Users (Plan Users Management)
- **Icon**: 👥 nebo "group" icon
- **Label**: "Users"
- **Action**: Otevře PlanUsersDialog pro správu uživatelů plánu
- **Description**: Správa uživatelů plánu (Add, Edit, Delete)

### Future Expansion
Menu je navrženo pro snadné přidání dalších položek:
- Share Plan (sdílení plánu s ostatními)
- Export Plan (export do JSON/CSV)
- Duplicate Plan (vytvoření kopie)
- Archive Plan (archivace dokončeného plánu)
- Plan Settings (nastavení specifická pro plán)

## Behavior

### Opening Menu
1. Uživatel klikne na context menu ikonu (⋮)
2. Menu se animovaně vysune dolů (slide-down)
3. Backdrop se zobrazí s fade-in
4. Menu se zobrazí nad ostatním obsahem (zIndex vysoký)
5. Menu je zarovnáno vpravo pod ikonou

### Closing Menu
1. Kliknutí na backdrop → zavře menu
2. Kliknutí na položku menu → provede akci a zavře menu
3. Back button (Android) → zavře menu
4. Změna obrazovky (swipe na jiný plán) → automaticky zavře menu

### State Management
```typescript
const [planMenuVisible, setPlanMenuVisible] = useState(false);

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

// Auto-close při změně plánu
useEffect(() => {
  if (planMenuVisible) {
    closePlanMenu();
  }
}, [currentIndex]);
```

## Integration with Existing Code

### Header Layout Update
Aktuální floatingHeader:
```
[☰]  [Plans (X/Y)]  [🔄 Refresh]
```

Nový floatingHeader:
```
[☰]  [Plans (X/Y)]  [🔄 Refresh]  [⋮]
```

**Poznámka**: Refresh button je dočasný, v budoucnu bude odstraněn.

### Component Structure
```tsx
<View style={[styles.floatingHeader, { top: STATUS_BAR_HEIGHT }]}>
  <View style={styles.headerRow}>
    {/* Global Menu hamburger */}
    <Pressable onPress={toggleMenu} style={styles.hamburgerButton}>
      <Text style={styles.hamburgerIcon}>☰</Text>
    </Pressable>
    
    {/* Title */}
    <View style={styles.headerTitleContainer}>
      <Text style={styles.headerTitle}>Plans ({currentIndex + 1}/{screens.length})</Text>
    </View>
    
    {/* Refresh button */}
    <Pressable onPress={handleRefresh} style={styles.refreshButton}>
      <Text style={styles.refreshText}>Refresh</Text>
    </Pressable>
    
    {/* Plan Context Menu - pouze pokud je zobrazený validní plán */}
    {showPlanMenu && (
      <Pressable onPress={togglePlanMenu} style={styles.contextMenuButton}>
        <Text style={styles.contextMenuIcon}>⋮</Text>
      </Pressable>
    )}
  </View>
</View>

{/* Plan Context Menu */}
{planMenuVisible && (
  <>
    <Pressable 
      style={styles.menuBackdrop} 
      onPress={closePlanMenu}
      activeOpacity={1}
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
```

## Styling

### Context Menu Button
```typescript
contextMenuButton: {
  padding: 8,
  marginLeft: 8,
  borderRadius: 6,
  backgroundColor: 'transparent',
}
```

### Context Menu Icon
```typescript
contextMenuIcon: {
  fontSize: 24,
  color: '#333',
  fontWeight: '700',
  lineHeight: 24,
}
```

### Plan Menu Container
```typescript
planMenuContainer: {
  position: 'absolute',
  top: 60,
  right: 0,
  width: 280,
  backgroundColor: '#ffffff',
  borderRadius: '8px 0 8px 8px',
  shadowColor: '#000',
  shadowOffset: { width: -2, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 10,
  zIndex: 1000,
  marginRight: 8,
}
```

### Menu Item
Same as Global Menu:
```typescript
menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
}

menuItemLast: {
  borderBottomWidth: 0,
}
```

## Accessibility
- Pressable poskytuje vizuální feedback (opacity change)
- Velké touch targets (minimum 48x48px)
- Jasné ikony a popisky
- Backdrop pro intuitivní zavření menu
- Context menu se objevuje pouze když je relevantní (validní plán zobrazen)

## Related Components
- **PlanUsersDialog**: Voláno z "Users" položky
- **UserDialog**: Používáno v PlanUsersDialog pro Add/Edit operace

## Related Use Cases
- Budoucí UC-XX: Manage Plan Users (through PlanUsersDialog)

## Implementation Notes
1. Menu se renderuje pouze když `planMenuVisible === true`
2. Backdrop sdílí stejný zIndex jako Global Menu backdrop
3. Menu container má vyšší zIndex než backdrop
4. Zobrazení podmíněno: `showPlanMenu = currentIndex < plans.length && !isCreateScreen`
5. Auto-close při změně plánu (useEffect monitoring currentIndex)
6. Menu je zarovnáno vpravo (right: 0, marginRight: 8)
7. Menu items jsou Pressable pro native feel

## Testing Considerations
- Testovat zobrazení/skrytí při přepínání mezi plány
- Ověřit správné zavření menu při swipe na jiný plán
- Kontrola správného zarovnání vpravo
- Testovat na různých velikostech obrazovek
- Ověřit, že se nezobrazí na Create Plan screen
- Testovat vizuální feedback při hover/press
- Testovat na iOS i Android (elevation vs shadow)

## Technical Challenges
- **Challenge**: Rozlišit mezi Global Menu a Plan Context Menu
  - **Solution**: Různé state proměnné (`menuVisible` vs `planMenuVisible`)
- **Challenge**: Auto-close při změně plánu
  - **Solution**: useEffect s dependency na `currentIndex`
- **Challenge**: Správné umístění vpravo
  - **Solution**: `right: 0` místo `left: 0`, záporný shadowOffset.width
