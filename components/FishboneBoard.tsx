"use client";

import FishboneCard from "./FishboneCard";
import FishboneDrawer from "./FishboneDrawer";
import { useFishboneDocument } from "../hooks/useFishboneDocument";
import type { FishboneDocument } from "../lib/fishbone-types";

type FishboneBoardProps = {
  initialDocument: FishboneDocument;
};

export default function FishboneBoard({
  initialDocument,
}: FishboneBoardProps) {
  const {
    selectedNode,
    children,
    currentDepth,
    canGoUp,
    editor,
    isSaving,
    saveError,
    updateSelectedField,
    commitSelectedNode,
    selectChild,
    goToParent,
    goToTop,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    updateEditorField,
    submitEditor,
  } = useFishboneDocument(initialDocument);

  return (
    <main className="workspace-shell">
      <div className="workspace-grid">
        <section className="hero-panel composer-panel">
          <div className="composer-top">
            <span className="depth-badge">階層 {currentDepth}</span>
            <div className="composer-actions">
              <button
                type="button"
                className="ghost-button"
                disabled={!canGoUp}
                onClick={goToParent}
              >
                一つ上に戻る
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={!canGoUp}
                onClick={goToTop}
              >
                トップに戻る
              </button>
            </div>
          </div>

          <div className="focus-stack">
            <label className="field-label" htmlFor="focus-title">
              タイトル
            </label>
            <input
              id="focus-title"
              className="title-input"
              type="text"
              value={selectedNode.title}
              placeholder={
                selectedNode.id === "root"
                  ? "現状存在する大きな課題を入力"
                  : "要素タイトルを入力"
              }
              onChange={(event) => updateSelectedField("title", event.target.value)}
              onBlur={() => void commitSelectedNode()}
            />

            <label className="field-label" htmlFor="focus-notes">
              備考
            </label>
            <textarea
              id="focus-notes"
              className="notes-input"
              value={selectedNode.notes}
              placeholder="観察メモ、仮説、差分、補足など"
              onChange={(event) => updateSelectedField("notes", event.target.value)}
              onBlur={() => void commitSelectedNode()}
            />
          </div>
        </section>

        <section className="branch-panel cards-panel">
          <div className="section-row compact">
            <h2>{selectedNode.title ? `${selectedNode.title} の下位要素` : "下位要素"}</h2>
            <button type="button" className="text-button" onClick={openCreateEditor}>
              カードを追加
            </button>
          </div>

          {saveError ? <p className="status-text error">{saveError}</p> : null}
          {!saveError && isSaving ? <p className="status-text">保存中です。</p> : null}

          {children.length > 0 ? (
            <div className="card-grid">
              {children.map((node, index) => (
                <FishboneCard
                  key={node.id}
                  index={index + 1}
                  node={node}
                  onSelect={() => selectChild(node.id)}
                  onEdit={() => openEditEditor(node)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>まだ下位カードがありません。</h3>
              <p>
                右下の丸いプラスボタンか、上の追加ボタンから新しい要素を作成してください。
              </p>
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        className="floating-add"
        aria-label={`${selectedNode.title || "選択中の要素"}の下にカードを追加`}
        onClick={openCreateEditor}
      >
        +
      </button>

      <FishboneDrawer
        editor={editor}
        onChange={updateEditorField}
        onClose={closeEditor}
        onSave={submitEditor}
      />
    </main>
  );
}
