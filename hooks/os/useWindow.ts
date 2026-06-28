"use client";

import { useCallback, useEffect, useState } from "react";

export interface WindowPosition {
  x: number;
  y: number;
}

export default function useWindow(
  initialPosition: WindowPosition = {
    x: 250,
    y: 120,
  }
) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setDragging(true);

      setOffset({
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      });
    },
    [position]
  );

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      if (!dragging) return;

      setPosition({
        x: event.clientX - offset.x,
        y: event.clientY - offset.y,
      });
    }

    function onMouseUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, offset]);

  return {
    position,
    dragging,
    onMouseDown,
  };
}