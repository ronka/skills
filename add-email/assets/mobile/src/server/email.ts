import { Resend } from 'resend';

import { renderEmail, type EmailContent } from './email-template';

export type EmailMessage = {
  to: string;
  subject: string;
  replyTo?: string;
  /** Same key, same email: Resend sends it once within 24 hours. Use it for retried sends. */
  idempotencyKey?: string;
} & ({ html: string; text: string } | { content: EmailContent });

// Expo's lint rule (expo/no-dynamic-env-var) requires static process.env.NAME access.
function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/**
 * Sends one transactional email through Resend. Server-only: call it from
 * API routes (`src/app/**\/*+api.ts`), never from screens.
 * Returns the Resend message ID, or throws with the provider's reason.
 */
export async function sendEmail(message: EmailMessage) {
  const resend = new Resend(required(process.env.RESEND_API_KEY, 'RESEND_API_KEY'));
  const body = 'content' in message ? renderEmail(message.content) : message;

  const { data, error } = await resend.emails.send(
    {
      from: required(process.env.EMAIL_FROM, 'EMAIL_FROM'),
      to: message.to,
      subject: message.subject,
      html: body.html,
      text: body.text,
      replyTo: message.replyTo,
    },
    message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
  );

  if (error) throw new Error(`Resend rejected the email: ${error.message}`);
  if (!data?.id) throw new Error('Resend did not return a message ID');
  return data.id;
}
