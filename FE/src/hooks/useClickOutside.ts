import { useEffect, type RefObject } from "react";

type OutsideEvent = MouseEvent | TouchEvent;

type OutsideRef = RefObject<HTMLElement | null>;

export function useClickOutside(
  refs: OutsideRef[],
  onOutsideClick: (event: OutsideEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: OutsideEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInside = refs.some((ref) => {
        const element = ref.current;
        return element ? element.contains(target) : false;
      });

      if (!clickedInside) {
        onOutsideClick(event);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [refs, onOutsideClick, enabled]);
}
