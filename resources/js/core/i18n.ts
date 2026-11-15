/**
 * UI text. English is the default; Japanese ships with the editor. The
 * language is chosen by whoever integrates the editor, through the `locale`
 * attribute — never guessed from the browser, and not taken from `lang`,
 * which also governs the content being written.
 */

const EN = {
  editor: 'Rich text editor',
  toolbar: 'Formatting',
  undo: 'Undo',
  redo: 'Redo',
  bold: 'Bold',
  italic: 'Italic',
  strike: 'Strikethrough',
  paragraph: 'Paragraph',
  h2: 'Heading 2',
  h3: 'Heading 3',
  quote: 'Quote',
  ul: 'Bulleted list',
  ol: 'Numbered list',
  link: 'Link',
  code: 'Code block',
  image: 'Image',
  'link.dialog': 'Link',
  'link.url': 'URL',
  'link.newTab': 'Open in a new tab',
  'link.apply': 'Apply',
  'link.remove': 'Remove link',
  'link.close': 'Close',
  'link.invalid': 'Enter a URL starting with https://, http://, mailto: or tel:, or a path such as /page.',
  'image.dialog': 'Image',
  'image.edit': 'Edit image',
  'image.width': 'Width',
  'image.alt': 'Alternative text',
  'image.altHint': 'Describe the image for people who cannot see it',
  'image.altMissing': 'No alternative text yet. Describe the image — leave it empty only if the image is purely decorative.',
  'image.apply': 'Apply',
  'image.close': 'Close',
  'image.uploading': 'Uploading image…',
  'notice.close': 'Dismiss',
  'errors.OE-UPL-4001': 'The image is too large. Choose an image of {max} or smaller.',
  'errors.OE-UPL-4001.short': 'The image is too large. Choose a smaller image.',
  'errors.OE-UPL-4002': "This file type can't be uploaded. Choose a PNG, JPEG, GIF or WebP image.",
  'errors.OE-UPL-4003': "The image couldn't be uploaded. Check your connection and try again.",
  'errors.OE-UPL-4004': 'Your session may have expired. Copy your text somewhere safe, then reload the page and try again.',
  'errors.OE-UPL-4005': "The server couldn't save the image. Please try again later.",
  'errors.OE-UPL-4006': 'The image has too many pixels. Choose an image of at most {max} megapixels.',
  'errors.OE-UPL-4007': 'Too many images were uploaded in a short time. Wait a minute and try again.',
  'errors.OE-UPL-4900': "The image couldn't be uploaded.",
  'errors.OE-CORE-9001': 'Something went wrong in the editor. Copy your text somewhere safe before reloading the page.',
};

export type MessageKey = keyof typeof EN;
export type Messages = Record<MessageKey, string>;

const JA: Messages = {
  editor: 'リッチテキストエディタ',
  toolbar: '書式',
  undo: '元に戻す',
  redo: 'やり直す',
  bold: '太字',
  italic: '斜体',
  strike: '打ち消し線',
  paragraph: '段落',
  h2: '見出し 2',
  h3: '見出し 3',
  quote: '引用',
  ul: '箇条書き',
  ol: '番号付きリスト',
  link: 'リンク',
  code: 'コードブロック',
  image: '画像',
  'link.dialog': 'リンク',
  'link.url': 'URL',
  'link.newTab': '新しいタブで開く',
  'link.apply': '適用',
  'link.remove': 'リンクを解除',
  'link.close': '閉じる',
  'link.invalid': 'https://・http://・mailto:・tel: で始まる URL か、/page のようなパスを入力してください。',
  'image.dialog': '画像',
  'image.edit': '画像を編集',
  'image.width': '幅',
  'image.alt': '代替テキスト',
  'image.altHint': '画像が見えない人のために、画像の内容を説明します',
  'image.altMissing': '代替テキストがまだありません。画像の内容を説明してください（飾りだけの画像なら空のままで構いません）。',
  'image.apply': '適用',
  'image.close': '閉じる',
  'image.uploading': '画像をアップロードしています…',
  'notice.close': '閉じる',
  'errors.OE-UPL-4001': '画像のサイズが大きすぎます。{max} 以下の画像を選んでください。',
  'errors.OE-UPL-4001.short': '画像のサイズが大きすぎます。もっと小さい画像を選んでください。',
  'errors.OE-UPL-4002': 'この形式のファイルはアップロードできません。PNG・JPEG・GIF・WebP の画像を選んでください。',
  'errors.OE-UPL-4003': '画像をアップロードできませんでした。通信状況を確認して、もう一度お試しください。',
  'errors.OE-UPL-4004': 'セッションの有効期限が切れた可能性があります。入力した内容をコピーしてから、ページを再読み込みしてもう一度お試しください。',
  'errors.OE-UPL-4005': 'サーバーで画像を保存できませんでした。時間をおいて、もう一度お試しください。',
  'errors.OE-UPL-4006': '画像の画素数が多すぎます。{max} メガピクセル以下の画像を選んでください。',
  'errors.OE-UPL-4007': '短い時間に多くの画像がアップロードされました。1 分ほど待ってから、もう一度お試しください。',
  'errors.OE-UPL-4900': '画像をアップロードできませんでした。',
  'errors.OE-CORE-9001': 'エディタで予期しないエラーが発生しました。ページを再読み込みする前に、入力した内容をコピーしてください。',
};

const locales = new Map<string, Partial<Messages>>([
  ['en', EN],
  ['ja', JA],
]);

/**
 * Adds a language, or overrides strings of an existing one. Missing keys fall
 * back to English.
 *
 *   defineOhashiEditorLocale('fr', { bold: 'Gras', italic: 'Italique' });
 */
export function defineOhashiEditorLocale(code: string, messages: Partial<Messages>): void {
  if (typeof code !== 'string' || !/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(code)) {
    throw new TypeError(`[OE-CFG-1005] Invalid locale code: ${String(code)}`);
  }
  if (!messages || typeof messages !== 'object' || Object.values(messages).some((v) => typeof v !== 'string')) {
    throw new TypeError(`[OE-CFG-1005] Locale "${code}" must map message keys to strings.`);
  }
  const key = code.toLowerCase();
  locales.set(key, { ...(locales.get(key) ?? {}), ...messages });
}

/**
 * The user-facing message for an error code, with `{name}` placeholders
 * filled in. A code the editor does not know (a newer server, a custom
 * endpoint) falls back to the generic upload message — the code itself is
 * shown next to it, so support can still tell what happened. A message whose
 * placeholder has no value uses its `.short` variant when there is one.
 */
export function errorMessage(messages: Messages, code: string, params: Record<string, string | number> = {}): string {
  const table = messages as Record<string, string>;
  const key = `errors.${code}`;
  let template = table[key] ?? (code.startsWith('OE-CORE-') ? table['errors.OE-CORE-9001'] : table['errors.OE-UPL-4900'])!;
  const missing = (t: string) => Array.from(t.matchAll(/\{(\w+)\}/g)).some((m) => params[m[1]!] === undefined);
  if (missing(template) && table[`${key}.short`]) template = table[`${key}.short`]!;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (params[name] === undefined ? whole : String(params[name])));
}

/** Messages for `code` (exact, then its base language), falling back to English. */
export function resolveMessages(code: string | null): { messages: Messages; supported: boolean } {
  if (!code) return { messages: EN, supported: true };
  const lower = code.toLowerCase();
  const found = locales.get(lower) ?? locales.get(lower.split('-')[0]!);
  return { messages: { ...EN, ...(found ?? {}) }, supported: found !== undefined };
}
