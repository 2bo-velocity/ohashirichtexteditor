// Getting a manual record off the test machine. The pages also run from a
// file:// copy (npm run standalone), where the async clipboard API may be
// missing or refused, so every path has a fallback that cannot fail: the text
// is put in a selected textarea for Ctrl/Cmd+C, and it can be saved as a file.

export async function copyRecord(text, box, status) {
  box.value = text;
  box.hidden = false;
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copied. Paste it into the chat.';
    return;
  } catch {
    // Fall through to the selection-based copy.
  }
  box.focus();
  box.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  status.textContent = copied
    ? 'Copied. Paste it into the chat.'
    : 'Copying was blocked: the text below is selected — press Ctrl+C (Cmd+C on a Mac), or use Save as file.';
}

export function saveRecord(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
