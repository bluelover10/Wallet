import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
};

export const isMailConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

export const sendOtpEmail = async ({ to, otp, name = '' }) => {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[DEV OTP] No mail config — code for ${to}: ${otp}`);
    return { delivered: false, reason: 'mail-not-configured' };
  }
  const fromName = process.env.MAIL_SENDER_NAME || 'AUTH App';
  const from = `"${fromName}" <${process.env.GMAIL_USER}>`;
  const safeName = String(name || 'there').slice(0, 80);

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f7f8fa;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:linear-gradient(135deg,#4A4DDB,#5B5FEF 45%,#8E8EF4);padding:28px 24px;text-align:center">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">LedgerPro</div>
      <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:4px">Your household savings, tracked together</div>
    </div>
    <div style="padding:28px 24px;background:#fff">
      <p style="font-size:15px;color:#171b24;margin:0 0 8px">Hi ${safeName},</p>
      <p style="font-size:14px;color:#454b57;margin:0 0 16px;line-height:1.6">Use this code to verify your account. It expires in <b>5 minutes</b>.</p>
      <div style="text-align:center;margin:20px 0">
        <div style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#171b24;background:#f4f5f9;border:1px dashed #b4b4f9;border-radius:12px;padding:12px 20px 12px 28px">${otp}</div>
      </div>
      <p style="font-size:12px;color:#6b7280;line-height:1.6">If you didn't request this, you can safely ignore this email.<br/>Never share this code with anyone.</p>
    </div>
    <div style="padding:14px;text-align:center;font-size:11px;color:#9aa0ac;background:#f7f8fa">Sent by ${fromName} · LedgerPro auth</div>
  </div>`;

  const text = `Hi ${safeName},\n\nYour verification code is: ${otp}\nIt expires in 5 minutes.\n\nIf you didn't request this, ignore this email.`;

  try {
    await tx.sendMail({ from, to, subject: `Your verification code: ${otp}`, text, html });
    return { delivered: true };
  } catch (err) {
    console.error(`[MAIL] Failed to send OTP to ${to}:`, err.message);
    // Fallback to console in dev so signup is never blocked by SMTP issues
    console.log(`[DEV OTP] Verification code for ${to}: ${otp}`);
    return { delivered: false, reason: err.message };
  }
};

export const verifyMailConnection = async () => {
  const tx = getTransporter();
  if (!tx) return { ok: false, reason: 'mail-not-configured' };
  try {
    await tx.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
};
