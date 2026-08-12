import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
}

export default function ModalOverlay({
  children,
  onClose,
  className = "",
  panelClassName = "",
}: ModalOverlayProps) {
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 ${className}`}
      onClick={onClose}
    >
      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
