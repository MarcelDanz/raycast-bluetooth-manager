import { exec } from "child_process";

export async function isBlueutilInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("which blueutil", (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
