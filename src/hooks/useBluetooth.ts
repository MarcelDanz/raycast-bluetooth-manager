import { exec } from "child_process";
import { useState, useEffect, useCallback } from "react";
import { BluetoothDevice } from "../types";

interface SystemProfilerOutput {
  SPBluetoothDataType: {
    devices_list?: Record<string, DeviceInfo>[];
    device_connected_list?: Record<string, DeviceInfo>[];
    device_not_connected_list?: Record<string, DeviceInfo>[];
  }[];
}

interface DeviceInfo {
  device_name?: string;
  device_minorType: string;
  device_isconnected: "Yes" | "No";
  device_address: string;
}

const parseOutput = (jsonOutput: string): BluetoothDevice[] => {
  try {
    const data = JSON.parse(jsonOutput) as SystemProfilerOutput;
    const bluetoothInfo = data.SPBluetoothDataType[0];
    if (!bluetoothInfo) return [];

    // Collect all devices from various possible keys
    const allDeviceLists: Record<string, DeviceInfo>[] = [
      ...(bluetoothInfo.devices_list || []),
      ...(bluetoothInfo.device_connected_list || []),
      ...(bluetoothInfo.device_not_connected_list || []),
    ];

    if (allDeviceLists.length === 0) {
      return [];
    }

    const deviceMap = new Map<string, BluetoothDevice>();

    allDeviceLists
      .flatMap((deviceObject) => Object.entries(deviceObject))
      .forEach(([nameFromKey, info]) => {
        // Use device address as a more reliable key to avoid duplicates
        if (info.device_address && !deviceMap.has(info.device_address)) {
          deviceMap.set(info.device_address, {
            name: info.device_name || nameFromKey,
            address: info.device_address,
            connected: info.device_isconnected === "Yes",
            minorType: info.device_minorType,
          });
        }
      });

    return Array.from(deviceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to parse bluetooth data:", error);
    // Rethrow to be caught by the caller
    throw new Error("Could not parse JSON from system_profiler");
  }
};

export function useBluetooth() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = useCallback(() => {
    setIsLoading(true);
    setError(null);

    exec("/usr/sbin/system_profiler SPBluetoothDataType -json", (err, stdout) => {
      try {
        if (err) {
          throw err;
        }

        console.log("--- Raw system_profiler output ---");
        console.log(stdout);

        const parsedDevices = parseOutput(stdout);

        console.log("--- Parsed devices ---");
        console.log(parsedDevices);

        setDevices(parsedDevices);
      } catch (e) {
        setError(e as Error);
        // Clear devices on error
        setDevices([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchDevices();
  }, []);

  return { devices, error, isLoading, revalidate: fetchDevices };
}
