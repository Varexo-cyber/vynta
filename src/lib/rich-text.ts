export const ALLOWED_TAGS = new Set([
  "p",
  "div",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "span",
  "a",
  "font",
]);

const VOID_TAGS = new Set(["br", "img", "hr"]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  span: new Set(["style"]),
  font: new Set(["size"]),
};

/* ----------------------- Live Markdown cursor utilities ----------------------- */

/**
 * Get the character offset of the caret within a contenteditable element.
 */
export function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

/**
 * Set the caret at a specific character offset within a contenteditable element.
 */
export function setCaretCharacterOffset(element: HTMLElement, offset: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let remaining = offset;
  let found = false;

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (remaining <= len) {
        range.setStart(node, remaining);
        range.collapse(true);
        found = true;
        return true;
      }
      remaining -= len;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === "BR") {
        if (remaining <= 0) {
          range.setStartBefore(node);
          range.collapse(true);
          found = true;
          return true;
        }
        remaining -= 1;
      }
      for (let i = 0; i < el.childNodes.length; i++) {
        if (walk(el.childNodes[i])) return true;
      }
    }
    return false;
  }

  walk(element);

  if (!found) {
    range.selectNodeContents(element);
    range.collapse(false);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Extract plain text from a contenteditable element, preserving line breaks.
 */
export function contentEditableToText(element: HTMLElement): string {
  let text = "";
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === "BR") {
        text += "\n";
        return;
      }
      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i]);
      }
      if (["P", "DIV", "LI", "BLOCKQUOTE"].includes(tag)) {
        text += "\n";
      }
    }
  }
  walk(element);
  return text.replace(/\n{3,}/g, "\n\n").replace(/\n$/, "");
}

const FONT_SIZE_MAP: Record<string, string> = {
  "1": "14px",
  "2": "16px",
  "3": "16px",
  "4": "18px",
  "5": "18px",
  "6": "18px",
  "7": "18px",
};

const FORMATTED_RE =
  /^\s*<(?:p|div|br|b|strong|i|em|u|s|strike|code|pre|ul|ol|li|blockquote|span|a|font)\b/i;

export function isFormattedBody(body: string): boolean {
  return FORMATTED_RE.test(body);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plainTextToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const escaped = escapeHtml(trimmed);
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(?:p|div|li|blockquote|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

function cleanStyle(value: string): string | null {
  const sizes = value.match(/font-size\s*:\s*([0-9]+(?:\.[0-9]+)?px)/gi);
  if (!sizes || sizes.length === 0) return null;
  const size = sizes[sizes.length - 1];
  const match = size.match(/font-size\s*:\s*([0-9]+(?:\.[0-9]+)?px)/i);
  if (!match) return null;
  const px = parseFloat(match[1]);
  if (!isFinite(px) || px < 10 || px > 30) return null;
  const allowed = px < 14.5 ? "14px" : px < 17 ? "16px" : "18px";
  return `font-size:${allowed};`;
}

function cleanAttrs(tag: string, attrs: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return "";
  const out: string[] = [];
  const attrRe =
    /([a-zA-Z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(attrs)) !== null) {
    const name = m[1].toLowerCase();
    const rawValue = m[2] ?? m[3] ?? m[4] ?? "";
    if (!allowed.has(name)) continue;
    if (name === "style") {
      const cleaned = cleanStyle(rawValue);
      if (cleaned) out.push(`style="${cleaned}"`);
    } else if (name === "href" && tag === "a") {
      let href = rawValue.trim();
      if (
        !/^https?:\/\//i.test(href) &&
        !href.startsWith("/") &&
        !/^mailto:/i.test(href)
      ) {
        href = "#";
      }
      out.push(
        `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`
      );
    } else if (name === "size" && tag === "font") {
      if (/^[1-7]$/.test(rawValue.trim())) {
        out.push(`size="${rawValue.trim()}"`);
      }
    }
  }
  if (tag === "a" && !out.some((s) => s.startsWith("href="))) {
    out.push('href="#" target="_blank" rel="noopener noreferrer"');
  }
  return out.length ? " " + out.join(" ") : "";
}

export function sanitizeHtml(input: string): string {
  // Strip HTML comments first.
  const html = input.replace(/<!--[\s\S]*?-->/g, "");
  const out: string[] = [];
  let lastIndex = 0;
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(html)) !== null) {
    const [full, slash, tag, attrs] = match;
    const before = html.slice(lastIndex, match.index);
    out.push(escapeHtml(before));

    if (tag.toLowerCase() === "script" || tag.toLowerCase() === "style") {
      // Drop everything up to the closing tag.
      const closeRe = new RegExp(`</${tag}>`, "gi");
      const next = closeRe.exec(html);
      if (next) {
        tagRe.lastIndex = next.index + next[0].length;
      } else {
        tagRe.lastIndex = html.length;
      }
      lastIndex = tagRe.lastIndex;
      continue;
    }

    const tagLower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagLower)) {
      lastIndex = tagRe.lastIndex;
      continue;
    }

    if (slash) {
      if (stack[stack.length - 1] === tagLower) {
        stack.pop();
        out.push(`</${tagLower}>`);
      }
      lastIndex = tagRe.lastIndex;
      continue;
    }

    const cleanedAttrs = cleanAttrs(tagLower, attrs);
    if (VOID_TAGS.has(tagLower)) {
      out.push(`<${tagLower}${cleanedAttrs}>`);
    } else {
      stack.push(tagLower);
      if (tagLower === "font") {
        const sizeMatch = attrs.match(/size\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const sizeVal = sizeMatch?.[1] ?? sizeMatch?.[2] ?? sizeMatch?.[3] ?? "";
        const mapped = FONT_SIZE_MAP[sizeVal.trim()];
        if (mapped) {
          out.push(`<span style="font-size:${mapped};">`);
        } else {
          out.push(`<${tagLower}${cleanedAttrs}>`);
        }
      } else {
        out.push(`<${tagLower}${cleanedAttrs}>`);
      }
    }
    lastIndex = tagRe.lastIndex;
  }

  out.push(escapeHtml(html.slice(lastIndex)));

  while (stack.length) {
    const tag = stack.pop()!;
    if (tag === "font") {
      out.push("</span>");
    } else {
      out.push(`</${tag}>`);
    }
  }

  return out.join("");
}

const DANGEROUS_SCHEMES = /^\s*(javascript:|data:|vbscript:)/i;
const PX_PER_PT = 16 / 12;

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  if (DANGEROUS_SCHEMES.test(lower)) return false;
  return (
    /^https?:\/\//i.test(url) ||
    /^mailto:/i.test(url) ||
    /^tel:/i.test(url) ||
    /^\/[^/]/.test(url) ||
    url === "/"
  );
}

function normalizeFontSize(size: string | null): string | null {
  if (!size) return null;
  const match = size.trim().match(/^([0-9]+(?:\.[0-9]+)?)(px|pt|em|rem)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!isFinite(value) || value <= 0) return null;
  const unit = match[2].toLowerCase();
  let px = value;
  if (unit === "pt") px = value * PX_PER_PT;
  else if (unit === "em" || unit === "rem") px = value * 16;
  if (px < 14.5) return "14px";
  if (px < 17) return "16px";
  return "18px";
}

function convertNode(source: Node, target: Node, doc: Document) {
  source.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(doc.createTextNode(child.textContent ?? ""));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();

    // Drop scripts, styles, iframes, meta/link/head and their entire contents.
    if (
      [
        "SCRIPT",
        "STYLE",
        "IFRAME",
        "OBJECT",
        "EMBED",
        "META",
        "LINK",
        "TITLE",
        "HEAD",
        "HTML",
        "BODY",
      ].includes(tag)
    ) {
      return;
    }

    // Headings become plain bold paragraphs.
    if (/^H[1-6]$/.test(tag)) {
      const p = doc.createElement("p");
      const b = doc.createElement("b");
      convertNode(el, b, doc);
      if (b.textContent) p.appendChild(b);
      if (p.childNodes.length) target.appendChild(p);
      return;
    }

    if (!ALLOWED_TAGS.has(tag.toLowerCase())) {
      convertNode(el, target, doc);
      return;
    }

    if (tag === "BR") {
      target.appendChild(doc.createElement("br"));
      return;
    }

    if (tag === "A") {
      const href = el.getAttribute("href") || "";
      if (!isSafeUrl(href)) {
        convertNode(el, target, doc);
        return;
      }
      const a = doc.createElement("a");
      a.href = href;
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      convertNode(el, a, doc);
      target.appendChild(a);
      return;
    }

    if (tag === "SPAN" || tag === "FONT") {
      const span = doc.createElement("span");
      let size: string | null = null;
      if (tag === "FONT") {
        const sizeVal = (el.getAttribute("size") || "").trim();
        size = FONT_SIZE_MAP[sizeVal] || null;
      } else {
        size = normalizeFontSize(el.style.fontSize);
      }
      if (size) span.style.fontSize = size;
      convertNode(el, span, doc);
      if (!span.hasAttributes()) {
        while (span.firstChild) target.appendChild(span.firstChild);
      } else if (span.childNodes.length || span.textContent) {
        target.appendChild(span);
      }
      return;
    }

    if (tag === "STRONG" || tag === "B") {
      const b = doc.createElement("b");
      convertNode(el, b, doc);
      target.appendChild(b);
      return;
    }

    if (tag === "EM" || tag === "I") {
      const i = doc.createElement("i");
      convertNode(el, i, doc);
      target.appendChild(i);
      return;
    }

    if (tag === "STRIKE" || tag === "DEL" || tag === "S") {
      const s = doc.createElement("s");
      convertNode(el, s, doc);
      target.appendChild(s);
      return;
    }

    if (tag === "DIV") {
      const p = doc.createElement("p");
      convertNode(el, p, doc);
      if (p.childNodes.length) target.appendChild(p);
      return;
    }

    const out = doc.createElement(tag.toLowerCase());
    convertNode(el, out, doc);
    if (out.childNodes.length) target.appendChild(out);
  });
}

export function convertPastedHtml(html: string): string {
  if (typeof window !== "undefined" && window.DOMParser) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, "text/html");
    const wrapper = parsed.createElement("div");
    parsed.body.childNodes.forEach((node) =>
      wrapper.appendChild(node.cloneNode(true))
    );
    const cleaned = parsed.createElement("div");
    convertNode(wrapper, cleaned, parsed);
    return cleaned.innerHTML;
  }
  return sanitizeHtml(html);
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/__(?=\S)(.+?)(?<=\S)__/g, "<u>$1</u>")
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*(?=\S)([^*]+?)(?<=\S)\*([^*]|$)/g, "$1<i>$2</i>$3")
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "<s>$1</s>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function looksLikeMarkdown(text: string): boolean {
  const lines = text.split(/\r?\n/);
  const hasBlock = lines.some(
    (line) =>
      /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line) || /^>\s?/.test(line)
  );
  const hasInline =
    /\*\*\S[\s\S]*?\S\*\*/.test(text) ||
    /(^|[^*])\*\S[\s\S]*?\S\*([^*]|$)/.test(text) ||
    /__\S[\s\S]*?\S__/.test(text) ||
    /`[^`]+`/.test(text) ||
    /~~\S[\s\S]*?\S~~/.test(text) ||
    /\[[^\]]+\]\(https?:\/\/[^)]+\)/.test(text);
  return hasBlock || hasInline;
}

export function convertMarkdownToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;

  const closeListsAndQuote = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r/g, "");
    if (line.trim() === "") {
      closeListsAndQuote();
      out.push("<p><br></p>");
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    const quoteMatch = line.match(/^>\s?(.*)$/);

    if (ulMatch) {
      if (inOl || inQuote) closeListsAndQuote();
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    if (olMatch) {
      if (inUl || inQuote) closeListsAndQuote();
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineMarkdown(olMatch[2])}</li>`);
      continue;
    }

    if (quoteMatch) {
      if (inUl || inOl) closeListsAndQuote();
      if (!inQuote) {
        out.push("<blockquote>");
        inQuote = true;
      }
      out.push(`<p>${inlineMarkdown(quoteMatch[1])}</p>`);
      continue;
    }

    closeListsAndQuote();
    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeListsAndQuote();
  return out.join("");
}
