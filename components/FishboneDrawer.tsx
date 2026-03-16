"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";

import type {
  FishboneEditableField,
  FishboneEditorState,
} from "../lib/fishbone-types";

type FishboneDrawerProps = {
  editor: FishboneEditorState;
  onChange: (field: FishboneEditableField, value: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export default function FishboneDrawer({
  editor,
  onChange,
  onClose,
  onSave,
}: FishboneDrawerProps) {
  const compositionRef = useRef(false);

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    const isComposing =
      compositionRef.current || Boolean(event.nativeEvent.isComposing);

    if (event.key !== "Enter" || isComposing) {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      void onSave();
    }
  }

  const modeLabel = editor.mode === "create" ? "カードを追加" : "カードを編集";
  const actionLabel = editor.mode === "create" ? "追加する" : "更新する";

  return (
    <>
      <button
        type="button"
        className={`drawer-backdrop ${editor.isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!editor.isOpen}
      />

      <aside
        className={`drawer-panel ${editor.isOpen ? "open" : ""}`}
        aria-hidden={!editor.isOpen}
      >
        <div className="drawer-header">
          <span className="eyebrow">{modeLabel}</span>
          <h2>{modeLabel}</h2>
          <p>{editor.contextLine}</p>
        </div>

        <div className="drawer-form">
          <label className="field-label" htmlFor="drawer-title">
            タイトル
          </label>
          <input
            id="drawer-title"
            className="drawer-input"
            type="text"
            value={editor.title}
            placeholder="要素タイトルを入力"
            onChange={(event) => onChange("title", event.target.value)}
            onCompositionStart={() => {
              compositionRef.current = true;
            }}
            onCompositionEnd={() => {
              compositionRef.current = false;
            }}
            onKeyDown={handleKeyDown}
          />

          <label className="field-label" htmlFor="drawer-notes">
            備考
          </label>
          <textarea
            id="drawer-notes"
            className="drawer-textarea"
            value={editor.notes}
            placeholder="補足、観察メモ、仮説など"
            onChange={(event) => onChange("notes", event.target.value)}
            onCompositionStart={() => {
              compositionRef.current = true;
            }}
            onCompositionEnd={() => {
              compositionRef.current = false;
            }}
            onKeyDown={handleKeyDown}
          />

          {editor.error ? (
            <p className="drawer-error">{editor.error}</p>
          ) : (
            <p className="drawer-hint">
              保存はボタン操作です。IME変換中の Enter では追加されません。必要なら
              `Cmd/Ctrl + Enter` で保存できます。
            </p>
          )}
        </div>

        <div className="drawer-footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            閉じる
          </button>
          <button type="button" className="solid-button" onClick={() => void onSave()}>
            {actionLabel}
          </button>
        </div>
      </aside>
    </>
  );
}
