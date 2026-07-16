import type { ModalProps } from "antd";
import { Modal } from "antd";
import { useIsMobile } from "../hooks/useIsMobile";

// Drop-in replacement for antd Modal that renders as a bottom-sheet on phones.
// On desktop / wide viewports it behaves exactly like the standard Modal.
// Rounded top corners, mask preserved, back-button dismissal via useBackClose
// is still up to the caller (unchanged from Modal semantics).
export function Sheet(props: ModalProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return <Modal {...props} />;
  return (
    <Modal
      {...props}
      centered={false}
      style={{ top: "auto", margin: 0, padding: 0, maxWidth: "100vw", ...props.style }}
      wrapClassName={`zenith-bottom-sheet ${props.wrapClassName ?? ""}`.trim()}
      styles={{
        ...(props.styles ?? {}),
        content: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
          ...(props.styles?.content ?? {}),
        },
      }}
    />
  );
}
