export async function copyTextToClipboard(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error('Không có nội dung để sao chép.');

  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(text);
    return;
  }

  if (!globalThis.document?.body) throw new Error('Trình duyệt không hỗ trợ sao chép tự động.');
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Trình duyệt không cho phép truy cập bộ nhớ tạm.');
}
