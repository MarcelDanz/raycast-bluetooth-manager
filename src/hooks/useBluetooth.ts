import { useState, useEffect, useCallback } from "react";
import * as blueutil from "blueutil";
import { BluetoothDevice } from "../types";

export function useBluetooth() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const blueutilDevices = await blueutil.list();

      const devices = blueutilDevices
        .map((d) => ({
          name: d.name,
          address: d.address,
          connected: d.connected,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setDevices(devices);
    } catch (e) {
      setError(e as Error);
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, []);

  return { devices, error, isLoading, revalidate: fetchDevices };
}
