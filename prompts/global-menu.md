# Global Menu (Hamburger Menu)

## Overview
Globální navigační menu aplikace, přístupné z hlavní obrazovky Plans. Poskytuje přístup k globálním funkcím a nastavením aplikace.

## UI Specification

### Position & Layout
- **Umístění**: Levý horní roh floatingHeader, před nápisem "Plans (X/Y)"
- **Ikona**: Hamburger menu (☰ - tři horizontální čárky)
- **Styl ikony**:
  - Velikost: 24px
  - Barva: #333 (dark gray)
  - Padding: 8px pro větší touch target
  - TouchableOpacity pro vizuální feedback

### Menu Type
- **Typ**: Pull-Down menu (rozbalovací nabídka)
- **Animace**: Smooth slide-down s fade-in efektem
- **Pozice menu**: Pod hamburger ikonou, zarovnáno vlevo
- **Overlay**: Poloprůhledný backdrop (#00000080) pokrývající celou obrazovku
- **Close**: Kliknutí mimo menu nebo na backdrop zavře menu

### Menu Container
- **Šířka**: 280px (nebo 75% šířky obrazovky, maximálně 320px)
- **Pozice**: Absolute, top: 60px (pod headerem), left: 0
- **Pozadí**: Bílé (#ffffff)
- **Shadow**: Výrazný stín pro floating efekt
  - shadowColor: '#000'
  - shadowOffset: { width: 2, height: 2 }
  - shadowOpacity: 0.25
  - shadowRadius: 8
  - elevation: 10 (Android)
- **Border radius**: 0 8px 8px 0 (zaoblené pravé rohy)

## Menu Items

### Structure
Každá položka menu má:
- **Icon**: Material Icons nebo emoji (levá strana)
- **Label**: Text popisující funkci
- **Divider**: Jemná čára (#e0e0e0) mezi položkami

### Menu Item Styling
```typescript
{
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16px,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0'
}
```

### Current Menu Items

#### 1. Default User
- **Icon**: 👤 nebo "person" icon
- **Label**: "Default User"
- **Action**: Otevře UserDialog pro editaci App Default User
- **Description**: Umožňuje nastavit výchozího uživatele aplikace

#### 2. About
- **Icon**: ℹ️ nebo "info" icon
- **Label**: "About"
- **Action**: Otevře AboutDialog s informacemi o aplikaci
- **Description**: Zobrazí verzi, autora, licenci aplikace

### Future Expansion
Menu je navrženo pro snadné přidání dalších položek:
- Settings / Preferences
- Import / Export data
- Help / Documentation
- Logout (pokud bude autentizace)
- Theme settings (Dark mode)

## Behavior

### Opening Menu
1. Uživatel klikne na hamburger ikonu
2. Menu se animovaně vysune dolů (slide-down)
3. Backdrop se zobrazí s fade-in
4. Menu se zobrazí nad ostatním obsahem (zIndex vysoký)

### Closing Menu
1. Kliknutí na backdrop → zavře menu
2. Kliknutí na položku menu → provede akci a zavře menu
3. Back button (Android) → zavře menu

### State Management
```typescript
const [menuVisible, setMenuVisible] = useState(false);

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
```

## Integration with Existing Code

### Header Layout Update
Aktuální floatingHeader:
```
[Plans (X/Y)]    [Refresh]
```

Nový floatingHeader:
```
[☰]  [Plans (X/Y)]    [Refresh]
```

### Component Structure
```tsx
<View style={styles.floatingHeader}>
  <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
    <Text style={styles.hamburgerIcon}>☰</Text>
  </TouchableOpacity>
  
  <View style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>Plans ({visiblePlans.length}/{totalPlans})</Text>
  </View>
  
  {/* Existing add and refresh buttons */}
</View>

{/* Global Menu */}
{menuVisible && (
  <>
    <TouchableOpacity 
      style={styles.menuBackdrop} 
      onPress={closeMenu}
      activeOpacity={1}
    />
    <View style={styles.menuContainer}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress(openDefaultUserDialog)}
      >
        <Text style={styles.menuIcon}>👤</Text>
        <Text style={styles.menuLabel}>Default User</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress(openAboutDialog)}
      >
        <Text style={styles.menuIcon}>ℹ️</Text>
        <Text style={styles.menuLabel}>About</Text>
      </TouchableOpacity>
    </View>
  </>
)}
```

## Styling

### Hamburger Button
```typescript
hamburgerButton: {
  padding: 8,
  marginRight: 12,
  borderRadius: 6,
  backgroundColor: 'transparent',
}
```

### Hamburger Icon
```typescript
hamburgerIcon: {
  fontSize: 24,
  color: '#333',
  fontWeight: '600',
}
```

### Menu Backdrop
```typescript
menuBackdrop: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 999,
}
```

### Menu Container
```typescript
menuContainer: {
  position: 'absolute',
  top: 60,
  left: 0,
  width: 280,
  backgroundColor: '#ffffff',
  borderRadius: '0 8px 8px 0',
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 10,
  zIndex: 1000,
}
```

### Menu Item
```typescript
menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
}
```

### Menu Icon
```typescript
menuIcon: {
  fontSize: 20,
  marginRight: 12,
  width: 24,
  textAlign: 'center',
}
```

### Menu Label
```typescript
menuLabel: {
  fontSize: 16,
  color: '#333',
  fontWeight: '500',
}
```

## Accessibility
- TouchableOpacity poskytuje vizuální feedback (opacity change)
- Velké touch targets (minimum 48x48px)
- Jasné ikony a popisky
- Backdrop pro intuitivní zavření menu

## Related Components
- **UserDialog**: Voláno z "Default User" položky
- **AboutDialog**: Voláno z "About" položky (bude vytvořen)

## Related Use Cases
- Budoucí UC-XX: Edit Default User (through UserDialog)
- Budoucí UC-XX: View Application Information

## Implementation Notes
1. Menu se renderuje pouze když `menuVisible === true`
2. Backdrop má nižší zIndex než menuContainer
3. Menu items jsou TouchableOpacity pro native feel
4. Poslední položka by neměla mít borderBottom (použít lastChild check nebo podmínku)
5. Menu se automaticky zavře po akci (handleMenuItemPress)

## Testing Considerations
- Testovat na různých velikostech obrazovek
- Ověřit správné zavření menu při kliknutí mimo
- Kontrola vizuálního feedbacku při hover/press
- Testovat na iOS i Android (elevation vs shadow)
