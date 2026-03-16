"use client";

import FishboneCard from "./FishboneCard";
import FishboneDrawer from "./FishboneDrawer";
import { useFishboneEditor } from "../hooks/fishbone/useFishboneEditor";
import { useFishboneEditorSubmission } from "../hooks/fishbone/useFishboneEditorSubmission";
import { useFishboneGraphState } from "../hooks/fishbone/useFishboneGraphState";
import { useFishboneNodeDeletion } from "../hooks/fishbone/useFishboneNodeDeletion";
import { useFishbonePersistence } from "../hooks/fishbone/useFishbonePersistence";
import { useFishboneSelectedNode } from "../hooks/fishbone/useFishboneSelectedNode";
import { useFishboneSelection } from "../hooks/fishbone/useFishboneSelection";
import { listUndefinedParentNodes } from "../lib/fishbone-graph";
import type { FishboneDocument } from "../lib/fishbone-types";

type FishboneBoardProps = {
  initialDocument: FishboneDocument;
};

export default function FishboneBoard({
  initialDocument,
}: FishboneBoardProps) {
  const { graph, initialGraph, draftRevisionRef, applyGraph, replaceGraph } =
    useFishboneGraphState(initialDocument);
  const {
    selectedNodeId,
    selectedNode,
    children,
    currentDepth,
    canGoUp,
    selectChild,
    goToParent,
    goToTop,
    reconcileSelection,
  } = useFishboneSelection(graph);
  const {
    editor,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    updateEditorField,
    setEditorError,
    toggleAttachedUndefinedNode,
  } = useFishboneEditor();
  const { isSaving, saveError, clearSaveError, persistGraph } =
    useFishbonePersistence({
      initialGraph,
      draftRevisionRef,
      replaceGraph,
      reconcileSelection,
    });
  const { updateSelectedField, commitSelectedNode } = useFishboneSelectedNode({
    graph,
    selectedNodeId,
    applyGraph,
    persistGraph,
    clearSaveError,
  });
  const { submitEditor } = useFishboneEditorSubmission({
    graph,
    editor,
    applyGraph,
    persistGraph,
    clearSaveError,
    closeEditor,
    setEditorError,
  });
  const { deleteNode } = useFishboneNodeDeletion({
    graph,
    applyGraph,
    persistGraph,
    clearSaveError,
    reconcileSelection,
  });
  const undefinedParentNodes = listUndefinedParentNodes(graph);
  const canDeleteSelectedNode = selectedNode.id !== graph.rootId;

  async function handleDeleteNode(nodeId: string): Promise<void> {
    const targetNode = graph.nodes[nodeId];

    if (!targetNode || targetNode.id === graph.rootId) {
      return;
    }

    const confirmed = window.confirm(
      targetNode.childIds.length > 0
        ? "このノードを削除すると、子ノードは親が undefined の状態で残ります。続行しますか？"
        : "このノードを削除します。続行しますか？",
    );

    if (!confirmed) {
      return;
    }

    if (editor.isOpen && editor.targetNodeId === nodeId) {
      closeEditor();
    }

    await deleteNode(nodeId);
  }

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
              {canDeleteSelectedNode ? (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => void handleDeleteNode(selectedNode.id)}
                >
                  このノードを削除
                </button>
              ) : null}
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
            <button
              type="button"
              className="text-button"
              onClick={() => openCreateEditor(selectedNode)}
            >
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

          {undefinedParentNodes.length > 0 ? (
            <div className="undefined-parent-panel">
              <div className="section-row compact">
                <h3>親が undefined のノード</h3>
                <p>
                  親ノードが削除されて切り離された要素です。新しいカードの追加時に子として接続できます。
                </p>
              </div>

              <div className="undefined-parent-list">
                {undefinedParentNodes.map((node) => (
                  <article key={node.id} className="undefined-parent-card">
                    <div className="undefined-parent-copy">
                      <span className="eyebrow">親: undefined</span>
                      <strong>{node.title || "無題の要素"}</strong>
                      <p>{node.notes.trim() || "備考はまだありません。"}</p>
                      <span className="card-meta">下位カード {node.childIds.length} 件</span>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => openEditEditor(node)}
                    >
                      編集
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <button
        type="button"
        className="floating-add"
        aria-label={`${selectedNode.title || "選択中の要素"}の下にカードを追加`}
        onClick={() => openCreateEditor(selectedNode)}
      >
        +
      </button>

      <FishboneDrawer
        editor={editor}
        undefinedParentNodes={undefinedParentNodes}
        onChange={updateEditorField}
        onToggleAttachUndefinedNode={toggleAttachedUndefinedNode}
        onClose={closeEditor}
        onSave={submitEditor}
        onDelete={() => handleDeleteNode(editor.targetNodeId)}
        canDelete={editor.mode === "edit" && editor.targetNodeId !== graph.rootId}
      />
    </main>
  );
}
