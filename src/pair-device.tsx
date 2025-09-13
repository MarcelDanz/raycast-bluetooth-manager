import { Action, ActionPanel, Icon, List, showToast, Toast, popToRoot, Color, hideToast } from "@raycast/api";
import { exec } from "child_process";
import { useEffect, useState } from "react";
import { useBluetoothDiscovery } from "./hooks/useBluetoothDiscovery";
import { useBluetooth } from "./hooks/useBluetooth";

export default function Command() {
  const { devices, error, isLoading, blueutilPath, revalidate } = useBluetoothDiscovery();
  const { devices: pairedDevices } = useBluetooth();
  const [isPairing, setIsPairing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pairedDeviceAddresses = new Set(pairedDevices.map((d) => d.address));

  useEffect(() => {
    if (isLoading) {
      showToast({ style: Toast.Style.Animated, title: "Scanning for devices..." });
    } else {
      hideToast();
    }
  }, [isLoading]);

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

  async function handlePairDevice(address: string, name: string) {
    if (!blueutilPath) {
      showToast({
        style: Toast.Style.Failure,
        title: "blueutil not found",
        message: "Please ensure blueutil is installed and in your PATH.",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Pairing with ${name}...`,
    });

    setIsPairing(true);
    try {
      exec(`"${blueutilPath}" --pair ${address}`, (err, stdout, stderr) => {
        setIsPairing(false);
        if (err || (stderr && stderr.includes("Failed"))) {
          toast.style = Toast.Style.Failure;
          toast.title = `Failed to pair with ${name}`;
          toast.message = stderr || err?.message;
          revalidate();
          return;
        }

        toast.style = Toast.Style.Success;
        toast.title = `Paired with ${name}`;
        revalidate();
      });
    } catch (err) {
      setIsPairing(false);
      toast.style = Toast.Style.Failure;
      toast.title = "Error";
      toast.message = err instanceof Error ? err.message : "Unknown error";
      revalidate();
    }
  }

  if (!isLoading && !blueutilPath) {
    return (
      <List>
        <List.EmptyView
          title="blueutil Not Found"
          description="Please install it with Homebrew (brew install blueutil) and ensure it's in your PATH."
          icon={Icon.Warning}
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading || isPairing}
      searchBarPlaceholder="Scanning for devices..."
      selectedItemId={selectedId || undefined}
      onSelectionChange={(id) => {
        id && setSelectedId(id);
      }}
    >
      <List.EmptyView
        title={error ? "Could not discover devices" : "No new devices found"}
        description={error ? error.message : "Make sure your device is in pairing mode and press ⌘+R to rescan."}
        icon={error ? Icon.XMarkCircle : Icon.Bluetooth}
      />
      {devices.map((device) => {
        const isPaired = pairedDeviceAddresses.has(device.address);
        return (
          <List.Item
            key={device.address}
            id={device.address}
            title={device.name}
            subtitle={isPaired ? `${device.address} (Paired)` : device.address}
            icon={{ source: Icon.Bluetooth, tintColor: isPaired ? Color.SecondaryText : undefined }}
            actions={
              <ActionPanel>
                <Action
                  title="Pair Device"
                  onAction={() => handlePairDevice(device.address, device.name)}
                  disabled={isPaired}
                />
                <Action title="Rescan" onAction={revalidate} shortcut={{ modifiers: [], key: "r" }} />
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
        );
      })}
    </List>
  );
}
