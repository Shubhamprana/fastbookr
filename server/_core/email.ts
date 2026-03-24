import { ENV } from "./env.js";

type EmailRecipient = {
  email: string;
  name?: string;
};

type EmailPayload = {
  to: EmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
};

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function hasEmailConfig() {
  return Boolean(
    ENV.brevoApiKey &&
      ENV.brevoSenderEmail &&
      ENV.brevoSenderName
  );
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!hasEmailConfig()) {
    console.warn("[Email] Brevo is not fully configured. Skipping email send.", {
      hasApiKey: Boolean(ENV.brevoApiKey),
      senderEmail: ENV.brevoSenderEmail || null,
      senderName: ENV.brevoSenderName || null,
    });
    return false;
  }

  if (!payload.to.length) {
    console.warn("[Email] No recipients provided. Skipping email send.");
    return false;
  }

  try {
    console.log("[Email] Sending email...", {
      from: ENV.brevoSenderEmail,
      to: payload.to.map((item) => item.email),
      subject: payload.subject,
    });

    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": ENV.brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: ENV.brevoSenderName,
          email: ENV.brevoSenderEmail,
        },
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Email] Failed to send email (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }

    console.log("[Email] Email accepted by Brevo.", {
      to: payload.to.map((item) => item.email),
      subject: payload.subject,
    });
    return true;
  } catch (error) {
    console.warn("[Email] Error sending email:", error);
    return false;
  }
}

export async function sendAdminAlert(subject: string, textContent: string, htmlContent?: string) {
  if (!ENV.brevoAdminEmail) {
    console.warn("[Email] BREVO_ADMIN_EMAIL not configured. Skipping admin alert.");
    return false;
  }

  console.log("[Email] Preparing admin alert...", {
    adminEmail: ENV.brevoAdminEmail,
    subject,
  });

  return sendEmail({
    to: [{ email: ENV.brevoAdminEmail, name: "Admin" }],
    subject,
    textContent,
    htmlContent,
  });
}
