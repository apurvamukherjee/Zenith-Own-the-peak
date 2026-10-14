// Exports that work in the browser *and* the Android app. The Capacitor
// WebView ignores <a download> and has no navigator.share, so on native the
// file is written to the app cache and handed to the OS share sheet (Drive,
// Files, WhatsApp, email…). Static imports for the same reason as haptics.ts:
// a bare dynamic import() of a plugin fails inside the WebView.
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export type ShareOutcome = "done" | "copied" | "cancelled";

const isNative = () => Capacitor.isNativePlatform();

// The share sheet being dismissed rejects on every platform; that's a user
// choice, not a failure.
function isCancel(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return err instanceof Error && /cancel/i.test(err.message);
}

function browserDownload(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next task: some engines start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Save a text file: share sheet on native, download in the browser. */
export async function saveFile(name: string, content: string, mime: string): Promise<ShareOutcome> {
  if (!isNative()) {
    browserDownload(name, content, mime);
    return "done";
  }
  const { uri } = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: name, files: [uri], dialogTitle: `Save ${name}` });
    return "done";
  } catch (err) {
    if (isCancel(err)) return "cancelled";
    throw err;
  }
}

/** Share plain text: native sheet, then Web Share, then the clipboard. */
export async function shareText(title: string, text: string): Promise<ShareOutcome> {
  try {
    if (isNative()) {
      await Share.share({ title, text, dialogTitle: title });
      return "done";
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return "done";
    }
  } catch (err) {
    if (isCancel(err)) return "cancelled";
    throw err;
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
