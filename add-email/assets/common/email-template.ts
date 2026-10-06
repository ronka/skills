/**
 * Base layout for every transactional email. Plain HTML strings with table
 * layout and inline styles, because email clients ignore most CSS.
 * Fill `emailBrand` from PRODUCT.md and DESIGN.md.
 */
export const emailBrand = {
  productName: "Product name",
  // Primary locale from PRODUCT.md, for example "he" or "en".
  lang: "he",
  dir: "rtl" as "rtl" | "ltr",
  colors: {
    background: "#f6f6f4",
    surface: "#ffffff",
    text: "#111111",
    muted: "#666666",
    button: "#111111",
    // Must meet WCAG AA contrast against `button`.
    buttonText: "#ffffff",
  },
};

// Arial and Tahoma ship Hebrew glyphs on every major email client.
const fontStack = "Arial, Tahoma, 'Segoe UI', Helvetica, sans-serif";

export type EmailContent = {
  /** Shown in the inbox list next to the subject. */
  preview?: string;
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  /** Small print under the button, such as why the user got this email. */
  footer?: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const { productName, lang, dir, colors } = emailBrand;
  const align = dir === "rtl" ? "right" : "left";
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${colors.text}">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const action = content.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${colors.button}"><a href="${escapeHtml(content.action.url)}" style="display:inline-block;padding:12px 24px;font-family:${fontStack};font-size:16px;font-weight:700;color:${colors.buttonText};text-decoration:none;border-radius:999px">${escapeHtml(content.action.label)}</a></td></tr></table>`
    : "";
  const footer = content.footer
    ? `<p style="margin:0;font-size:13px;line-height:1.6;color:${colors.muted}">${escapeHtml(content.footer)}</p>`
    : "";
  const preview = content.preview
    ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(content.preview)}</div>`
    : "";

  const html = `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${colors.background}">
${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.background}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="max-width:560px;background:${colors.surface};border-radius:16px">
<tr><td dir="${dir}" style="padding:32px;font-family:${fontStack};text-align:${align}">
<p style="margin:0 0 24px;font-size:14px;font-weight:700;color:${colors.muted}">${escapeHtml(productName)}</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:${colors.text}">${escapeHtml(content.heading)}</h1>
${paragraphs}
${action}
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    ...content.paragraphs,
    content.action ? `${content.action.label}: ${content.action.url}` : "",
    content.footer ?? "",
    productName,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}
