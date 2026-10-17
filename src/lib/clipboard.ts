/** Puts text on the clipboard: through the Clipboard API, or where that is
    refused (an insecure context, an old engine) the old way, a hidden
    textarea selected and copied. */
export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* nothing else to try */
    }
    document.body.removeChild(ta);
  }
}
