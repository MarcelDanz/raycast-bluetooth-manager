import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { useBluetooth } from "./hooks/useBluetooth";

const getDeviceIcon = (minorType: string): Icon => {
  switch (minorType.toLowerCase()) {
    case "keyboard":
      return Icon.Keyboard;
    case "mouse":
      return Icon.Mouse;
    case "headset":
    case "headphones":
    case "earbuds":
      return Icon.Headphones;
    case "gamepad":
      return Icon.GameController;
    default:
      return Icon.Bluetooth;
  }
};

export default function Command() {
  const { devices, error, isLoading, revalidate } = useBluetooth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (devices.length > 0 && !selectedId) {
      setSelectedId(devices[0].address);
    }
  }, [devices]);

  const selectNextItem = () => {
    if (!selectedId) return;
    const currentIndex = devices.findIndex((d) => d.address === selectedId);
    if (currentIndex < devices.length - 1) {
      setSelectedId(devices[currentIndex + 1].address);
    }
  };

  const selectPreviousItem = () => {
    if (!selectedId) return;
    const currentIndex = devices.findIndex((d) => d.address === selectedId);
    if (currentIndex > 0) {
      setSelectedId(devices[currentIndex - 1].address);
    }
  };

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
    <List
      isLoading={isLoading}
      selectedItemId={selectedId}
      onSelectionChange={(id) => {
        id && setSelectedId(id);
      }}
    >
      <List.EmptyView
        title={error ? "Could not fetch devices" : "No devices found"}
        description={error ? error.message : "Press ⌘+R to refresh."}
        icon={error ? Icon.XMarkCircle : Icon.Bluetooth}
      />
      {devices.map((device) => (
        <List.Item
          key={device.address}
          id={device.address}
          title={device.name}
          icon={getDeviceIcon(device.minorType)}
          accessories={[{ icon: device.connected ? { source: Icon.Checkmark, tintColor: "raycast-green" } : Icon.XMark }]}
          actions={
            <ActionPanel>
              <Action
                title={device.connected ? "Disconnect" : "Connect"}
                onAction={() => handleToggleConnection(device.name)}
              />
              <Action title="Refresh" onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
              <Action
                title="Select Previous Item"
                icon={Icon.ChevronUp}
                onAction={selectPreviousItem}
                shortcut={{ modifiers: ["cmd", "ctrl"], key: "k" }}
              />
              <Action
                title="Select Next Item"
                icon={Icon.ChevronDown}
                onAction={selectNextItem}
                shortcut={{ modifiers: ["cmd", "ctrl"], key: "j" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
