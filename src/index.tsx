import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useBluetooth } from "./hooks/useBluetooth";

export default function Command() {
  const { devices, error, isLoading, revalidate } = useBluetooth();

  async function handleToggleConnection(deviceName: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Toggling connection...",
    });

    try {
      // This path assumes the script is in the `assets` directory at the root of the extension.
      const { exec } = require("child_process");
      exec(`osascript assets/toggle_connection.applescript "${deviceName}"`, (error, stdout, stderr) => {
        if (error || stderr) {
          toast.style = Toast.Style.Failure;
          toast.title = "Failed to toggle connection";
          toast.message = stderr || error?.message;
          return;
        }

        toast.style = Toast.Style.Success;
        toast.title = "Connection toggled";

        // Refresh the list after a short delay to allow the connection state to update
        setTimeout(() => {
          revalidate();
        }, 1000);
      });
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Error";
      toast.message = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return (
    <List isLoading={isLoading}>
      <List.EmptyView
        title={error ? "Could not fetch devices" : "No devices found"}
        description={error ? error.message : "Press ⌘+R to refresh."}
        icon={error ? Icon.XMarkCircle : Icon.Bluetooth}
      />
      {devices.map((device) => (
        <List.Item
          key={device.address}
          title={device.name}
          subtitle={device.minorType}
          icon={device.connected ? { source: Icon.Checkmark, tintColor: "raycast-green" } : Icon.XMark}
          actions={
            <ActionPanel>
              <Action
                title={device.connected ? "Disconnect" : "Connect"}
                onAction={() => handleToggleConnection(device.name)}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
              />
              <Action title="Refresh" onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
