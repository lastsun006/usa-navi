"use client";

interface Props {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export function QuickReply({ replies, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="text-sm px-3 py-1.5 rounded-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
