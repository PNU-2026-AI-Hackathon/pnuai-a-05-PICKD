import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

export function useResizableCols(
  storageKey: string,
  defaults: Record<string, number>,
  minWidths?: Record<string, number>,
) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {
      //
    }

    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      //
    }
  }, [storageKey, widths]);

  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
  } | null>(null);

  const onMouseDown = useCallback(
    (key: string) => (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        key,
        startX: e.clientX,
        startW: widths[key] ?? defaults[key] ?? 120,
      };

      const onMove = (event: globalThis.MouseEvent) => {
        const currentDrag = dragRef.current;
        if (!currentDrag) return;

        const { key, startX, startW } = currentDrag;
        const diff = event.clientX - startX;
        const minWidth = minWidths?.[key] ?? 70;
        const nextWidth = Math.max(minWidth, startW + diff);

        setWidths((prev) => ({
          ...prev,
          [key]: nextWidth,
        }));
      };

      const onUp = () => {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [widths, defaults, minWidths],
  );

  return { widths, onMouseDown };
}

export function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: MouseEvent) => void;
}) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/50 active:bg-blue-500/60"
    />
  );
}