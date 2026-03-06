"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Quote,
  Minus,
  Pilcrow,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};

const btn =
  "p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors";
const btnActive =
  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";

function ToolbarButton({
  editor,
  onClick,
  isActive,
  title,
  children,
}: {
  editor: Editor;
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${btn} ${isActive ? btnActive : ""}`}
      title={title}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Холбоос (URL):", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-800/50">
      {/* Font style */}
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      {/* Headings & paragraph */}
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive("paragraph")}
        title="Paragraph"
      >
        <Pilcrow className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      {/* Lists */}
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      {/* Alignment */}
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editor.isActive({ textAlign: "justify" })}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      {/* Link, blockquote, horizontal rule */}
      <ToolbarButton
        editor={editor}
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Insert link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        title="Horizontal line"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Тайлбар оруулна уу...",
  disabled = false,
  minHeight = "320px",
  className = "",
}: RichTextEditorProps) {
  const onUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener" } }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate,
    editorProps: {
      attributes: {
        class:
          "rich-editor-content min-h-[280px] px-3 py-3 focus:outline-none prose prose-sm max-w-none " +
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
      editor.commands.setContent(normalized, { emitUpdate: false });
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
        .rich-editor-content [style*="text-align: left"] { text-align: left; }
        .rich-editor-content [style*="text-align: center"] { text-align: center; }
        .rich-editor-content [style*="text-align: right"] { text-align: right; }
        .rich-editor-content [style*="text-align: justify"] { text-align: justify; }
        .rich-editor-content blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 0.5rem 0; color: #6b7280; }
        .rich-editor-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.75rem 0; }
        .rich-editor-content a { color: #2563eb; text-decoration: underline; }
      `}</style>
      <Toolbar editor={editor} />
      <div className="min-h-[280px]" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
