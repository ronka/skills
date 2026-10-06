import { Resend } from "resend";

import { renderEmail, type EmailContent } from "./email-template";

export type EmailMessage = {
  to: string;
  subject: string;
  replyTo?: string;
  /** Same key, same email: Resend sends it once within 24 hours. Use it for retried sends. */
  idempotencyKey?: string;
} & ({ html: string; text: string } | { content: EmailContent });

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/**
 * Sends one transactional email through Resend. Server-only.
 * Returns the Resend message ID, or throws with the provider's reason.
 */
export async function sendEmail(message: EmailMessage) {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const body = "content" in message ? renderEmail(message.content) : message;

  const { data, error } = await resend.emails.send(
    {
      from: requiredEnv("EMAIL_FROM"),
      to: message.to,
      subject: message.subject,
      html: body.html,
      text: body.text,
      replyTo: message.replyTo,
    },
    message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
  );

  if (error) throw new Error(`Resend rejected the email: ${error.message}`);
  if (!data?.id) throw new Error("Resend did not return a message ID");
  return data.id;
}
