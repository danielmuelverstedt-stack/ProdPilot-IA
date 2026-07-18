export interface VoiceShortcut { key: string; ctrl: boolean; alt: boolean; shift: boolean; label: string }
export function resolveVoiceShortcut(preset: string, custom = ""): VoiceShortcut {
  const value = preset === "custom" ? custom : ({ space: "Space", alt_space: "Alt+Space", ctrl_space: "Ctrl+Space", f8: "F8" }[preset] ?? "Ctrl+Space");
  const parts = value.split("+").map((part) => part.trim().toLowerCase()); const rawKey = parts.at(-1) ?? "space";
  return { key: rawKey === "space" ? " " : rawKey, ctrl: parts.includes("ctrl") || parts.includes("control"), alt: parts.includes("alt"), shift: parts.includes("shift"), label: value.replace("Space", "Espace") };
}
export function matchesVoiceShortcut(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "target">, shortcut: VoiceShortcut): boolean {
  const target = event.target as HTMLElement | null; const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable));
  if (typing && !shortcut.ctrl && !shortcut.alt) return false;
  return event.key.toLowerCase() === shortcut.key.toLowerCase() && event.ctrlKey === shortcut.ctrl && event.altKey === shortcut.alt && event.shiftKey === shortcut.shift;
}
