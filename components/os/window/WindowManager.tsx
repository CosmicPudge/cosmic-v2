"use client";

import { useWindow } from "./WindowProvider";
import WindowFrame from "./WindowFrame";

export default function WindowManager() {
  const { windows } = useWindow();

  if (windows.length === 0) {
    return null;
  }

  return (
    <>
      {windows.map((window) => (
        <WindowFrame
          key={window.id}
          window={window}
        />
      ))}
    </>
  );
}