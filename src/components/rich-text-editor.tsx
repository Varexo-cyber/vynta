"use client";

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Type,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  convertPastedHtml,
  convertMarkdownToHtml,
  plainTextToHtml,
  looksLikeMarkdown,
  getCaretCharacterOffsetWithin,
  setCaretCharacterOffset,
  contentEditableToText,
} from "@/lib/rich-text";

type FormatKey =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "unorderedList"
  | "orderedList"
  | "blockquote";

const SIZE_OPTIONS: { key: "small" | "normal" | "large"; label: string; size: string }[] = [
  { key: "small", label: "Klein", size: "14px" },
  { key: "normal", label: "Normaal", size: "16px" },
  { key: "large", label: "Groot", size: "18px" },
];

export interface RichTextEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  compact?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

function ToolbarButton({
  label,
  icon: Icon,
  pressed,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        pressed ? "bg-surface-2 text-foreground" : "hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  {
    value,
    onChange,
    placeholder,
    className,
    autoFocus = false,
    compact = false,
    onKeyDown,
  },
  ref
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<FormatKey, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
    blockquote: false,
  });
  const [sizeOpen, setSizeOpen] = useState(false);
  const [empty, setEmpty] = useState(true);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    // Ensure Enter creates <p> elements consistently.
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // ignore
    }
  }, []);

  // Sync external value -> contenteditable HTML
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    // value is plain text (Markdown). Convert to HTML for display.
    const html = value ? convertMarkdownToHtml(value) : "";
    el.innerHTML = html;
    setEmpty(!value?.trim());
  }, [value]);

  const refreshToolbar = useCallback(() => {
    setActive({
      bold: queryCommandState("bold"),
      italic: queryCommandState("italic"),
      underline: queryCommandState("underline"),
      strikeThrough: queryCommandState("strikeThrough"),
      unorderedList: document.queryCommandValue("insertUnorderedList") === "true",
      orderedList: document.queryCommandValue("insertOrderedList") === "true",
      blockquote:
        (document.queryCommandValue("formatBlock") || "").toString().toLowerCase() ===
        "blockquote",
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshToolbar);
    return () => document.removeEventListener("selectionchange", refreshToolbar);
  }, [refreshToolbar]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    // Extract plain text (Markdown) from the contenteditable
    const text = contentEditableToText(el);
    isInternalUpdate.current = true;
    onChange(text);
    setEmpty(!text.trim());
  }, [onChange]);

  const reformatDisplay = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    // Save caret position as character offset
    const caretOffset = getCaretCharacterOffsetWithin(el);
    // Extract plain text
    const text = contentEditableToText(el);
    // Convert to display HTML
    const html = text ? convertMarkdownToHtml(text) : "";
    el.innerHTML = html;
    // Restore caret
    if (text) {
      setCaretCharacterOffset(el, Math.min(caretOffset, text.length));
    }
  }, []);

  const handleInput = useCallback(() => {
    emit();
    // Reformat the display to show live Markdown
    // Use requestAnimationFrame to avoid interfering with the current input event
    requestAnimationFrame(() => {
      reformatDisplay();
    });
  }, [emit, reformatDisplay]);

  const exec = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      emit();
      requestAnimationFrame(() => reformatDisplay());
    },
    [emit, reformatDisplay]
  );

  const applyLink = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const existingText = sel.toString().trim();
    const suggested = "https://";
    const url = typeof window !== "undefined" ? prompt("Voeg een link toe", suggested) : null;
    if (!url) return;

    editorRef.current?.focus();
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    if (existingText) {
      a.textContent = existingText;
      if (!range.collapsed) range.deleteContents();
      range.insertNode(a);
    } else {
      a.textContent = url;
      range.insertNode(a);
    }

    const newRange = document.createRange();
    newRange.setStartAfter(a);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    emit();
    requestAnimationFrame(() => reformatDisplay());
  }, [emit, reformatDisplay]);

  const applySize = useCallback(
    (size: string) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      editorRef.current?.focus();

      const span = document.createElement("span");
      span.style.fontSize = size;

      if (!range.collapsed) {
        try {
          range.surroundContents(span);
        } catch {
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        span.appendChild(document.createTextNode("\u200B"));
        range.insertNode(span);
        const textNode = span.firstChild as Text;
        const caret = document.createRange();
        caret.setStart(textNode, 1);
        caret.setEnd(textNode, 1);
        sel.removeAllRanges();
        sel.addRange(caret);
      }
      emit();
    },
    [emit]
  );

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        const el = editorRef.current;
        if (!el) {
          onChange((value || "") + text);
          return;
        }
        el.focus();
        document.execCommand("insertText", false, text);
        emit();
        requestAnimationFrame(() => reformatDisplay());
      },
      focus: () => editorRef.current?.focus(),
    }),
    [onChange, value, emit, reformatDisplay]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          exec("bold");
          return;
        case "i":
          e.preventDefault();
          exec("italic");
          return;
        case "u":
          e.preventDefault();
          exec("underline");
          return;
        case "k":
          e.preventDefault();
          applyLink();
          return;
      }
    }
    onKeyDown?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    if (html.trim()) {
      const clean = convertPastedHtml(html);
      document.execCommand("insertHTML", false, clean);
    } else {
      const text = e.clipboardData.getData("text/plain");
      if (text) {
        // Insert as plain text — Markdown will be formatted on next reformat
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
        document.execCommand("insertHTML", false, escaped);
      }
    }
    emit();
    requestAnimationFrame(() => reformatDisplay());
    setTimeout(refreshToolbar, 0);
  };

  return (
    <div className={cn("relative", className)}>
      {!compact && (
        <div className="mb-2 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface p-1.5">
        <ToolbarButton
          label="Vetgedrukt"
          icon={Bold}
          pressed={active.bold}
          onClick={() => exec("bold")}
        />
        <ToolbarButton
          label="Cursief"
          icon={Italic}
          pressed={active.italic}
          onClick={() => exec("italic")}
        />
        <ToolbarButton
          label="Onderstreept"
          icon={Underline}
          pressed={active.underline}
          onClick={() => exec("underline")}
        />
        <ToolbarButton
          label="Doorgehaald"
          icon={Strikethrough}
          pressed={active.strikeThrough}
          onClick={() => exec("strikeThrough")}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Lijst met opsommingstekens"
          icon={List}
          pressed={active.unorderedList}
          onClick={() => exec("insertUnorderedList")}
        />
        <ToolbarButton
          label="Genummerde lijst"
          icon={ListOrdered}
          pressed={active.orderedList}
          onClick={() => exec("insertOrderedList")}
        />
        <ToolbarButton
          label="Citaat"
          icon={Quote}
          pressed={active.blockquote}
          onClick={() => exec("formatBlock", "<blockquote>")}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={applyLink}
          aria-label="Link toevoegen"
          title="Link toevoegen"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Link2 size={16} strokeWidth={2} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSizeOpen((v) => !v)}
            aria-label="Tekstgrootte"
            title="Tekstgrootte"
            aria-haspopup="true"
            aria-expanded={sizeOpen}
            className="flex h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <Type size={16} strokeWidth={2} />
            <ChevronDown size={12} />
          </button>
          {sizeOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    applySize(opt.size);
                    setSizeOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                  style={{ fontSize: opt.size }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoFocus={autoFocus}
          className={cn(
            "w-full resize-none overflow-auto rounded-2xl border border-border bg-background text-[16px] leading-relaxed outline-none transition-colors focus:border-border-strong",
            compact ? "min-h-[60px] p-3 text-[15px]" : "min-h-[160px] p-4",
            "[&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
          )}
          style={{ whiteSpace: "pre-wrap" }}
        />
        {empty && !value && placeholder && (
          <div className="pointer-events-none absolute left-4 top-4 text-[16px] text-muted">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
});

function queryCommandState(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}
