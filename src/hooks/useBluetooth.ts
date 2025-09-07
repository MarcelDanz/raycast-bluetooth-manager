import { exec } from "child_process";
import { useState, useEffect, useCallback } from "react";
import { BluetoothDevice } from "../types";

interface SystemProfilerOutput {
  SPBluetoothDataType: {
    devices_list: Record<string, DeviceInfo>;
  }[];
}

interface DeviceInfo {
  device_minorType: string;
  device_isconnected: "Yes" | "No";
  device_address: string;
}

const parseOutput = (jsonOutput: string): BluetoothDevice[] => {
  try {
    const data = JSON.parse(jsonOutput) as SystemProfilerOutput;
    const deviceList = data.SPBluetoothDataType[0]?.devices_list;
    if (!deviceList) return [];

    return Object.entries(deviceList)
      .map(([name, info]) => ({
        name: name,
        address: info.device_address,
        connected: info.device_isconnected === "Yes",
        minorType: info.device_minorType,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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

    exec("system_profiler SPBluetoothDataType -json", (err, stdout) => {
      try {
        if (err) {
          throw err;
        }

        const parsedDevices = parseOutput(stdout);
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
