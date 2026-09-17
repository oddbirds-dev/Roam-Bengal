import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, getMarkRange, useEditor, useEditorState } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { AdminIcon } from "@/components/admin/icons";
import { LinkPicker, type LinkPickResult } from "@/components/admin/link-picker";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { resolveCustomFonts } from "@/lib/custom-fonts";
import { markdown } from "@/lib/markdown";
import {
  BASE_FONT_PX,
  BASE_LINE_HEIGHT,
  COLOR_OPTIONS,
  ColorClassMark,
  CustomColorMark,
  FONT_OPTIONS,
  FontSizeMark,
  LINE_HEIGHT_STEP,
  LineHeightMark,
  MAX_FONT_PX,
  MAX_LINE_HEIGHT,
  MIN_FONT_PX,
  MIN_LINE_HEIGHT,
  createFontClassMark,
} from "@/lib/tiptap-rich-marks";

const HEADING_LEVELS = [2, 3, 4] as const;
const DEFAULT_CUSTOM_COLOR = "#1E5F3B";

interface PickerState {
  range: [number, number];
  initial: { href: string; text: string };
  editing: boolean;
}

const BoldLinePrefix = Extension.create<{ pattern: RegExp }>({
  name: "boldLinePrefix",
  addOptions: () => ({ pattern: /$^/ }),
  addProseMirrorPlugins() {
    const pattern = this.options.pattern;
    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) return null;
          const bold = newState.schema.marks.bold;
          if (!bold) return null;
          const transaction = newState.tr;
          newState.doc.descendants((node, position) => {
            if (node.type.name !== "paragraph") return;
            pattern.lastIndex = 0;
            const separator = pattern.exec(node.textContent);
            if (!separator || separator.index <= 0) return;
            const from = position + 1;
            const to = from + separator.index;
            let fullyBold = true;
            node.nodesBetween(0, separator.index, (child) => {
              if (child.isText && !bold.isInSet(child.marks)) fullyBold = false;
            });
            if (!fullyBold) transaction.addMark(from, to, bold.create());
          });
          return transaction.docChanged ? transaction : null;
        },
      }),
    ];
  },
});

/** In block-separated inline-lines fields (e.g. advice blocks), a paragraph preceded by
 * an empty paragraph (or the very first paragraph in the document) is a block's heading —
 * Enter there just starts that block's body line, same as before. Enter anywhere else ends
 * the current block: it inserts the blank separator paragraph the parser needs *and* the
 * next paragraph in one keystroke, so a single Enter is enough to start a new block.
 * Shift+Enter always adds a plain line within the current block, for the rare multi-line block. */
const BlockSeparatorEnter = Extension.create({
  name: "blockSeparatorEnter",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { editor } = this;
        const { selection } = editor.state;
        if (!selection.empty) return false;
        const { $from } = selection;
        const index = $from.index(0);
        const previous = index > 0 ? editor.state.doc.child(index - 1) : null;
        const previousIsBlank = !previous || previous.textContent.trim() === "";
        return previousIsBlank
          ? editor.chain().focus().splitBlock().run()
          : editor.chain().focus().splitBlock().splitBlock().run();
      },
      "Shift-Enter": () => this.editor.chain().focus().splitBlock().run(),
    };
  },
});

/** TipTap-backed WYSIWYG. Values are emitted as HTML; legacy Markdown is normalized on load. */
export function RichTextarea({
  id,
  rows = 4,
  value,
  placeholder,
  onChange,
  ariaLabel,
  mode = "document",
  boldLinePrefixPattern,
  blockSeparatorOnEnter = false,
}: {
  id?: string;
  rows?: number;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  mode?: "document" | "inline-lines";
  boldLinePrefixPattern?: RegExp;
  /** Inline-lines only: Enter ends the current block (blank separator + new paragraph)
   * unless the line being split is a block's first line. */
  blockSeparatorOnEnter?: boolean;
}) {
  const inlineLines = mode === "inline-lines";
  const { custom_fonts } = useSiteSettings();
  const customFonts = resolveCustomFonts(custom_fonts);
  const customFontKey = customFonts.map((font) => font.className).join("|");
  const fontOptions = useMemo(
    () => [
      ...FONT_OPTIONS,
      ...customFonts.map((font) => ({ value: font.className, label: font.label })),
    ],
    // The key is stable even though the merged settings object is recreated during preview.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customFontKey],
  );
  const lastEmitted = useRef(value);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [showSource, setShowSource] = useState(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: inlineLines ? false : { levels: [...HEADING_LEVELS] },
          bulletList: inlineLines ? false : undefined,
          orderedList: inlineLines ? false : undefined,
          listItem: inlineLines ? false : undefined,
          listKeymap: inlineLines ? false : undefined,
          blockquote: inlineLines ? false : undefined,
          codeBlock: inlineLines ? false : undefined,
          horizontalRule: inlineLines ? false : undefined,
          link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } },
        }),
        ...(inlineLines ? [] : [TableKit.configure({ table: { resizable: false } })]),
        createFontClassMark(customFonts.map((font) => font.className)),
        ColorClassMark,
        FontSizeMark,
        LineHeightMark,
        CustomColorMark,
        ...(inlineLines && boldLinePrefixPattern
          ? [BoldLinePrefix.configure({ pattern: boldLinePrefixPattern })]
          : []),
        ...(inlineLines && blockSeparatorOnEnter ? [BlockSeparatorEnter] : []),
        Placeholder.configure({ placeholder: placeholder ?? "" }),
      ],
      content: markdown.parse(value || "") as string,
      onUpdate: ({ editor: current }) => {
        const html = current.isEmpty ? "" : current.getHTML();
        lastEmitted.current = html;
        onChange(html);
      },
      editorProps: {
        attributes: {
          class:
            "min-w-0 px-3.5 py-2.5 text-[0.88rem] leading-[1.6] outline-none " +
            "[&_a]:text-orange [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-green/30 " +
            "[&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 " +
            "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-rule " +
            "[&_td]:p-2 [&_th]:border [&_th]:border-rule [&_th]:bg-cream [&_th]:p-2",
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        },
      },
    },
    [customFontKey, inlineLines, boldLinePrefixPattern?.source, blockSeparatorOnEnter],
  );

  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(markdown.parse(value || "") as string, {
      emitUpdate: false,
    });
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            fontSize:
              Number.parseInt(String(current.getAttributes("fontSize").value ?? BASE_FONT_PX), 10) ||
              BASE_FONT_PX,
            lineHeight:
              Number.parseFloat(
                String(current.getAttributes("lineHeight").value ?? BASE_LINE_HEIGHT),
              ) || BASE_LINE_HEIGHT,
            headingLevel: current.isActive("heading")
              ? ((current.getAttributes("heading").level as number | undefined) ?? 0)
              : 0,
            bulletList: current.isActive("bulletList"),
            orderedList: current.isActive("orderedList"),
            blockquote: current.isActive("blockquote"),
            inTable: current.isActive("table"),
          }
        : null,
  });

  if (!editor) {
    return (
      <div
        className="rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 text-[0.88rem] text-muted"
        style={{ minHeight: `${rows * 1.5 + 2}rem` }}
      >
        Loading editor…
      </div>
    );
  }

  const toolbarState = state ?? {
    bold: false,
    italic: false,
    underline: false,
    fontSize: BASE_FONT_PX,
    lineHeight: BASE_LINE_HEIGHT,
    headingLevel: 0,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    inTable: false,
  };
  const button =
    "flex h-6 w-6 items-center justify-center rounded text-ink hover:bg-rule disabled:opacity-40";
  const active = "bg-rule text-green";
  const select =
    "cursor-pointer bg-transparent text-[0.72rem] font-medium text-ink outline-none hover:text-green disabled:opacity-40";

  const applySize = (raw: number) => {
    if (!Number.isFinite(raw) || editor.state.selection.empty) return;
    const size = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(raw)));
    editor.chain().focus().setMark("fontSize", { value: size }).run();
  };

  const applyLineHeight = (raw: number) => {
    if (!Number.isFinite(raw) || editor.state.selection.empty) return;
    const spacing = Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, Math.round(raw * 10) / 10));
    editor.chain().focus().setMark("lineHeight", { value: spacing }).run();
  };

  const openLinkPicker = () => {
    const { state: editorState } = editor;
    const { from, to, empty } = editorState.selection;
    const linkType = editorState.schema.marks.link;
    const range = linkType ? getMarkRange(editorState.doc.resolve(from), linkType) : undefined;
    if (range) {
      setPicker({
        range: [range.from, range.to],
        initial: {
          href: String(editor.getAttributes("link").href ?? ""),
          text: editorState.doc.textBetween(range.from, range.to),
        },
        editing: true,
      });
      return;
    }
    setPicker({
      range: [from, to],
      initial: { href: "", text: empty ? "" : editorState.doc.textBetween(from, to) },
      editing: false,
    });
  };

  const applyLink = ({ value: href, label }: LinkPickResult) => {
    if (!picker) return;
    const [from, to] = picker.range;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from, to },
        { type: "text", text: label.trim() || href, marks: [{ type: "link", attrs: { href } }] },
      )
      .run();
    setPicker(null);
  };

  const removeLink = () => {
    if (!picker) return;
    const [from, to] = picker.range;
    editor.chain().focus().setTextSelection({ from, to }).unsetLink().run();
    setPicker(null);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-rule bg-paper transition-colors focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-cream/40 px-2.5 py-1.5">
        {!inlineLines ? (
          <>
            <select
              title="Paragraph or sub-heading"
              disabled={showSource}
              value={toolbarState.headingLevel}
              onChange={(event) => {
                const level = Number(event.target.value);
                const chain = editor.chain().focus();
                if (level === 0) chain.setParagraph().run();
                else chain.setNode("heading", { level }).run();
              }}
              className={select}
            >
              <option value={0}>Normal text</option>
              {HEADING_LEVELS.map((level) => (
                <option key={level} value={level}>Sub-heading {level - 1}</option>
              ))}
            </select>
            <span className="h-4 w-px bg-rule" />
          </>
        ) : null}
        <select
          title="Font"
          disabled={showSource}
          value=""
          onChange={(event) => {
            if (event.target.value)
              editor.chain().focus().setMark("fontClass", { value: event.target.value }).run();
          }}
          className={select}
        >
          <option value="">Font</option>
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="h-4 w-px bg-rule" />
        <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => applySize(toolbarState.fontSize - 1)} title="Decrease text size" className={button}>
          <AdminIcon name="minus" className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={toolbarState.fontSize}
          min={MIN_FONT_PX}
          max={MAX_FONT_PX}
          disabled={showSource}
          title="Text size (px)"
          onChange={(event) => applySize(event.target.valueAsNumber)}
          className="w-11 rounded border border-rule bg-paper px-1 py-0.5 text-center text-[0.72rem] outline-none"
        />
        <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => applySize(toolbarState.fontSize + 1)} title="Increase text size" className={button}>
          <AdminIcon name="plus" className="h-3.5 w-3.5" />
        </button>
        <span className="h-4 w-px bg-rule" />
        <span title="Line spacing" className="flex h-6 w-6 items-center justify-center text-ink/70">
          <AdminIcon name="lineSpacing" className="h-3.5 w-3.5" />
        </span>
        <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => applyLineHeight(toolbarState.lineHeight - LINE_HEIGHT_STEP)} title="Decrease line spacing (Ctrl/Cmd+Shift+Down)" className={button}>
          <AdminIcon name="minus" className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={toolbarState.lineHeight}
          min={MIN_LINE_HEIGHT}
          max={MAX_LINE_HEIGHT}
          step={LINE_HEIGHT_STEP}
          disabled={showSource}
          title="Line spacing"
          onChange={(event) => applyLineHeight(event.target.valueAsNumber)}
          className="w-11 rounded border border-rule bg-paper px-1 py-0.5 text-center text-[0.72rem] outline-none"
        />
        <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => applyLineHeight(toolbarState.lineHeight + LINE_HEIGHT_STEP)} title="Increase line spacing (Ctrl/Cmd+Shift+Up)" className={button}>
          <AdminIcon name="plus" className="h-3.5 w-3.5" />
        </button>
        <span className="h-4 w-px bg-rule" />
        {([
          ["bold", "bold", "Bold text"],
          ["italic", "italic", "Italic text"],
          ["underline", "underline", "Underline text"],
        ] as const).map(([command, icon, title]) => (
          <button
            key={command}
            type="button"
            disabled={showSource}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus()[command === "bold" ? "toggleBold" : command === "italic" ? "toggleItalic" : "toggleUnderline"]().run()}
            title={title}
            aria-pressed={toolbarState[command]}
            className={`${button} ${toolbarState[command] ? active : ""}`}
          >
            <AdminIcon name={icon} className="h-3.5 w-3.5" />
          </button>
        ))}
        <span className="h-4 w-px bg-rule" />
        <select
          title="Text colour"
          disabled={showSource}
          value=""
          onChange={(event) => {
            if (event.target.value)
              editor.chain().focus().setMark("colorClass", { value: event.target.value }).run();
          }}
          className={select}
        >
          <option value="">Colour</option>
          {COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <label title="Custom text colour" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-rule">
          <input
            type="color"
            defaultValue={DEFAULT_CUSTOM_COLOR}
            disabled={showSource}
            aria-label="Custom text colour"
            onChange={(event) => editor.chain().focus().setMark("customColor", { value: event.target.value }).run()}
            className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        {!inlineLines ? (
          <>
            <span className="h-4 w-px bg-rule" />
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list" aria-pressed={toolbarState.bulletList} className={`${button} ${toolbarState.bulletList ? active : ""}`}>
              <AdminIcon name="listBullet" className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" aria-pressed={toolbarState.orderedList} className={`${button} ${toolbarState.orderedList ? active : ""}`}>
              <AdminIcon name="listOrdered" className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Highlighted quote" aria-pressed={toolbarState.blockquote} className={`${button} ${toolbarState.blockquote ? active : ""}`}>
              <AdminIcon name="quote" className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
        <span className="h-4 w-px bg-rule" />
        <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={openLinkPicker} title="Insert or edit a link" className={button}>
          <AdminIcon name="link" className="h-3.5 w-3.5" />
        </button>
        {!inlineLines && toolbarState.inTable ? (
          <>
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add table row" className={button}><AdminIcon name="plus" className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add table column" className={button}><AdminIcon name="table" className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" className={`${button} text-rust`}><AdminIcon name="trash" className="h-3.5 w-3.5" /></button>
          </>
        ) : !inlineLines ? (
          <button type="button" disabled={showSource} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table" className={button}>
            <AdminIcon name="table" className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {!inlineLines ? (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowSource((current) => !current)} title={showSource ? "Back to formatted view" : "Edit HTML source"} aria-pressed={showSource} className={`${button} ${showSource ? active : ""}`}>
            <AdminIcon name="code" className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showSource ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y bg-transparent px-3.5 py-2.5 font-mono text-[0.8rem] outline-none"
        />
      ) : (
        <EditorContent
          editor={editor}
          id={id}
          style={{ minHeight: `${rows * 1.5 + 1.25}rem` }}
          className="rich-textarea-content min-w-0"
        />
      )}

      {picker ? (
        <LinkPicker
          open
          onClose={() => setPicker(null)}
          onPick={applyLink}
          onRemove={picker.editing ? removeLink : undefined}
          initial={picker.initial}
          title={picker.editing ? "Edit link" : "Insert link"}
        />
      ) : null}
    </div>
  );
}
