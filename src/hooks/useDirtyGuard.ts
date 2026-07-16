import { useEffect } from "react";
import { App } from "antd";

// Bind to a `dirty` flag. When something tries to close (back button, tab
// visibility, unload), warn the user with a confirmation.
// Not a full "guard before every navigation" — that requires react-router 7's
// blocker API. This handles the two most common leak paths for now.
export function useDirtyGuard(dirty: boolean, onDiscard?: () => void) {
  const { modal } = App.useApp();

  useEffect(() => {
    if (!dirty) return;
    // Native beforeunload — the browser handles this with its own dialog.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /** Call from your modal's close/back handler. Returns a Promise<boolean>:
   *  true → the user chose to discard, close the modal. false → keep it open. */
  return async function guardedClose(): Promise<boolean> {
    if (!dirty) return true;
    return new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "Discard changes?",
        content: "You have unsaved edits. Leave without saving?",
        okText: "Discard",
        okButtonProps: { danger: true },
        cancelText: "Keep editing",
        onOk: () => { onDiscard?.(); resolve(true); },
        onCancel: () => resolve(false),
      });
    });
  };
}
