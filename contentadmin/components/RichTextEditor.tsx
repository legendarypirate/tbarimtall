"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};

// Simple toolbar for the editor
function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-800/50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${editor.isActive("bold") ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm font-medium italic ${editor.isActive("italic") ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 1 }) ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("paragraph") ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Paragraph"
      >
        P
      </button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("orderedList") ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        title="Numbered list"
      >
        1.
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Тайлбар оруулна уу...",
  disabled = false,
  minHeight = "120px",
  className = "",
}: RichTextEditorProps) {
  const onUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate,
    editorProps: {
      attributes: {
        class:
          "rich-editor-content min-h-[80px] px-3 py-2 focus:outline-none " +
          "border border-gray-300 dark:border-gray-600 rounded-b-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm",
      },
      handleDOMEvents: {
        paste: (view, event) => {
          // Allow default paste; TipTap handles it
          return false;
        },
      },
    },
  });

  // Sync controlled value when it changes externally (e.g. load product)
  useEffect(() => {
    if (!editor) return;
    const raw = value || "";
    const normalized =
      !raw || raw.trim() === ""
        ? "<p></p>"
        : raw.trimStart().startsWith("<")
          ? raw
          : `<p>${raw.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    const current = editor.getHTML();
    if (current !== normalized) {
      editor.commands.setContent(normalized, false);
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={`rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ${className}`}
        style={{ minHeight }}
      >
        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className={`rounded-md overflow-hidden rich-text-editor-wrapper ${className}`} style={{ minHeight: "auto" }}>
      <style>{`
        .rich-editor-content p { margin-bottom: 0.5rem; }
        .rich-editor-content p:last-child { margin-bottom: 0; }
        .rich-editor-content h1 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
        .rich-editor-content h2 { font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
        .rich-editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-editor-content li { margin-bottom: 0.25rem; }
      `}</style>
      <Toolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
