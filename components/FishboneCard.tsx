import type { FishboneNodeRecord } from "../lib/fishbone-types";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20l4.1-1 9.8-9.8a1.7 1.7 0 0 0 0-2.4l-.7-.7a1.7 1.7 0 0 0-2.4 0L5 15.9 4 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13.6 7.4 16.6 10.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type FishboneCardProps = {
  index: number;
  node: FishboneNodeRecord;
  onSelect: () => void;
  onEdit: () => void;
};

export default function FishboneCard({
  index,
  node,
  onSelect,
  onEdit,
}: FishboneCardProps) {
  const noteText = node.notes.trim() || "備考はまだありません。";
  const childCount = node.childIds.length;

  return (
    <article className="branch-card">
      <button
        type="button"
        className="card-edit"
        aria-label={`${node.title || "無題の要素"}を編集`}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
      >
        <PencilIcon />
      </button>

      <button type="button" className="card-button" onClick={onSelect}>
        <span className="card-index">要素 {String(index).padStart(2, "0")}</span>
        <strong>{node.title || "無題の要素"}</strong>
        <p className="card-notes">{noteText}</p>
        <span className="card-meta">下位カード {childCount} 件</span>
      </button>
    </article>
  );
}
