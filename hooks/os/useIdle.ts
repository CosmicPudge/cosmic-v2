"use client";

import { useEffect } from "react";

interface Props {
  timeout: number;

  onIdle: () => void;
}

export default function useIdle({
  timeout,
  onIdle,
}: Props) {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    function reset() {
      clearTimeout(timer);

      timer = setTimeout(
        onIdle,
        timeout
      );
    }

    reset();

    window.addEventListener(
      "mousemove",
      reset
    );

    window.addEventListener(
      "mousedown",
      reset
    );

    window.addEventListener(
      "touchstart",
      reset
    );

    window.addEventListener(
      "keydown",
      reset
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        "mousemove",
        reset
      );

      window.removeEventListener(
        "mousedown",
        reset
      );

      window.removeEventListener(
        "touchstart",
        reset
      );

      window.removeEventListener(
        "keydown",
        reset
      );
    };
  }, [timeout, onIdle]);
}