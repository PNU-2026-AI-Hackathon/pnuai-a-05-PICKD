import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";

export function useResizableCols(
  storageKey: string,
  defaults: Record<string, number>,
  minWidths?: Record<string, number>,
  maxWidths?: Record<string, number>,
) {
  const clamp = useCallback(
    (key: string, value: number) => {
      const min = minWidths?.[key] ?? 70;
      const max = maxWidths?.[key] ?? Number.POSITIVE_INFINITY;
      return Math.min(Math.max(value, min), max);
    },
    [minWidths, maxWidths],
  );

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const merged = raw
        ? { ...defaults, ...JSON.parse(raw) }
        : { ...defaults };

      Object.keys(merged).forEach((key) => {
        merged[key] = clamp(key, merged[key]);
      });

      return merged;
    } catch {
      return { ...defaults };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      // localStorage를 사용할 수 없는 환경에서는 저장만 생략합니다.
    }
  }, [storageKey, widths]);

  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
  } | null>(null);

  const onMouseDown = useCallback(
    (key: string) => (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setResizingKey(key);
      dragRef.current = {
        key,
        startX: event.clientX,
        startW: widths[key] ?? defaults[key] ?? 120,
      };

      const onMove = (moveEvent: globalThis.MouseEvent) => {
        const current = dragRef.current;
        if (!current) return;

        const nextWidth = clamp(
          current.key,
          current.startW + moveEvent.clientX - current.startX,
        );

        setWidths((previous) => ({
          ...previous,
          [current.key]: nextWidth,
        }));
      };

      const onUp = () => {
        dragRef.current = null;
        setResizingKey(null);
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
    [clamp, defaults, widths],
  );

  return { widths, onMouseDown, resizingKey };
}

export type DividerBound = {
  key: string;
  left: number;
};

/**
 * 브라우저가 실제로 렌더한 헤더 셀의 오른쪽 경계를 측정합니다.
 * colgroup의 숫자를 단순히 더하지 않으므로 스페이서가 남는 너비를 흡수해도
 * 리사이즈 선이 실제 열 경계에서 어긋나지 않습니다.
 */
export function useTableDividers(
  wrapperRef: RefObject<HTMLElement | null>,
  dependencies: readonly unknown[],
) {
  const [bounds, setBounds] = useState<DividerBound[]>([]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const measure = () => {
      const table = wrapper.querySelector("table");
      const tableLeft = table instanceof HTMLElement ? table.offsetLeft : 0;
      const headerCells = wrapper.querySelectorAll<HTMLElement>(
        "thead th[data-resizable-column]",
      );

      const next = Array.from(headerCells).map((cell) => ({
        key: cell.dataset.resizableColumn as string,
        left: tableLeft + cell.offsetLeft + cell.offsetWidth,
      }));

      setBounds((previous) => {
        const unchanged =
          previous.length === next.length &&
          previous.every(
            (bound, index) =>
              bound.key === next[index].key && bound.left === next[index].left,
          );

        return unchanged ? previous : next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);

    const table = wrapper.querySelector("table");
    if (table) observer.observe(table);

    return () => observer.disconnect();
    // dependencies는 열 순서·표시 여부·너비 변경 시 재측정하기 위한 값입니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return bounds;
}

export function ColumnDivider({
  left,
  onMouseDown,
  active,
}: {
  left: number;
  onMouseDown: (event: MouseEvent) => void;
  active?: boolean;
}) {
  const roundedLeft = Math.round(left);

  return (
    <div
      className="group/column-resize absolute inset-y-0 z-20"
      style={{ left: roundedLeft }}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors duration-150 ${
          active
            ? "bg-[#CBD5E1]"
            : "bg-transparent group-hover/column-resize:bg-[#CBD5E1]"
        }`}
      />
      <div
        className="absolute inset-y-0 left-0 w-2 -translate-x-[10px] cursor-col-resize select-none"
        style={{ touchAction: "none" }}
        onMouseDown={onMouseDown}
      />
    </div>
  );
}

/** 기존 사용처 호환용 헤더 전용 핸들. 대시보드 표에서는 ColumnDivider를 사용합니다. */
export function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (event: MouseEvent) => void;
}) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none"
    />
  );
}
