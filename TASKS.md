# Implementation Plan: New Bluetooth Features

This document outlines the implementation plan for adding two new features to the Bluetooth Manager Raycast extension:
1.  Forget a device.
2.  Detect and pair new devices.

---

## 1. Feature: Forget a Device

This feature will add an option to unpair (or "forget") a Bluetooth device directly from the device list in the main command.

### 1.1. User Interface (UI) Changes

-   In `src/index.tsx`, add a new `<Action>` to the `ActionPanel` for each device item.
-   The action title will be "Forget Device".
-   Use a destructive style: `style: Action.Style.Destructive`.
-   Use an appropriate icon, like `Icon.Trash`.
-   This action should be placed in its own `<ActionPanel.Section>` to separate it from the primary connection action.
-   Assign a keyboard shortcut, `x`.

### 1.2. Confirmation Dialog

-   Because unpairing is a destructive action, a confirmation dialog is necessary to prevent accidental unpairing.
-   Use Raycast's `confirmAlert` API before executing the unpair command.
-   The alert should clearly state the action, e.g., "Are you sure you want to forget 'Device Name'?".

### 1.3. Unpairing Logic

-   Create a new handler function, `handleForgetDevice(address: string, name: string)`, in `src/index.tsx`.
-   This function will be called by the "Forget Device" action.
-   Inside this function, after the user confirms the action, execute the `blueutil` command to unpair the device: `blueutil --unpair <address>`.
-   The `blueutilPath` state variable should be used, similar to `handleToggleConnection`.
-   The `exec` call should be wrapped to manage potential failures and provide feedback.

### 1.4. State Management and Feedback

-   Upon initiating the action, set the list to a loading state to show activity in the status bar. A new state, e.g., `isUnpairing`, will be managed.
-   Upon successful unpairing:
    -   Call `revalidate()` from the `useBluetooth` hook to refresh the device list. The device disappearing from the list serves as success feedback.
-   If the unpairing command fails:
    -   Show a failure `Toast` with an informative error message. This is recommended as there is no other non-intrusive UI element to display a contextual error for a failed action.

### 1.5. File-by-File Changes

-   **`src/index.tsx`**:
    -   Import `confirmAlert`, `Alert`, and `ActionPanel` from `@raycast/api`.
    -   Add the new `<Action>` inside the `ActionPanel`.
    -   Implement the `handleForgetDevice` function containing the confirmation and `exec` logic.

---

## 2. Feature: Detect and Pair New Devices

This feature will add a new Raycast command to discover and pair new Bluetooth devices.

### 2.1. New Raycast Command

-   In `package.json`, add a new entry to the `commands` array.
    -   `name`: `pair-device`
    -   `title`: "Pair New Bluetooth Device"
    -   `description`: "Scans for and pairs with new Bluetooth devices."
    -   `mode`: `view`
    -   Add a keyboard shortcut, for example `Cmd+Shift+P`.
-   Create a new source file for this command: `src/pair-device.tsx`.

### 2.2. Device Discovery Logic

-   The discovery process will be managed by a new custom hook: `useBluetoothDiscovery`.
-   Create a new file `src/hooks/useBluetoothDiscovery.ts` for this hook.
-   This hook will:
    -   Execute `blueutil --inquiry` to scan for nearby devices. This command runs for a duration (e.g., 10-20 seconds).
    -   Manage its own `isLoading`, `error`, and `discoveredDevices` states.
    -   Parse the `stdout` from `blueutil --inquiry`. The output format is typically `address: xx-xx-xx-xx-xx-xx, name: "Device Name", ...`. Regular expressions or string splitting can be used for parsing.
    -   Reuse the `findBlueutilPath` utility.

### 2.3. Pairing UI (`src/pair-device.tsx`)

-   This component will be the main view for the new command.
-   It will use the `useBluetoothDiscovery` hook to get the list of discovered devices.
-   It will display a `List` component showing the discovered devices.
    -   Each `List.Item` will represent a discoverable device, showing its name and address.
    -   The view should handle the `isLoading` state, showing a message like "Scanning for devices...".
-   Each list item will have an `ActionPanel` with a primary action: "Pair Device".

### 2.4. Pairing Logic

-   Create a `handlePairDevice(address: string, name: string)` function in `src/pair-device.tsx`.
-   This function will execute `blueutil --pair <address>`.
-   Modern devices using Secure Simple Pairing should not require a PIN. The implementation will proceed with this assumption.

### 2.5. State Management and Feedback

-   During pairing:
    -   Set the list to a loading state to show activity in the status bar.
-   Upon successful pairing:
    -   Automatically close the command window using `popToRoot`. The user will see the newly paired device in the main "Manage Bluetooth Devices" list upon its next refresh.
-   If pairing fails:
    -   Show a failure `Toast` with an informative error message from `blueutil`. This is the clearest way to communicate the error to the user without disrupting the view.

### 2.6. File-by-File Changes

-   **`package.json`**: Add the new command definition to the `commands` array.
-   **`src/types.ts`**: Add a new interface `DiscoveredBluetoothDevice` with `name` and `address` properties.
-   **`src/hooks/useBluetoothDiscovery.ts` (new file)**: Implement the hook to handle device discovery.
-   **`src/pair-device.tsx` (new file)**: Implement the UI and pairing logic for the new command.
