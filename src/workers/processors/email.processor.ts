import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || process.env.SMTP_PASSWORD || '';
const AGENTMAIL_INBOX_ID = process.env.AGENTMAIL_INBOX_ID || process.env.SMTP_USER || '';
const AGENTMAIL_API_BASE = 'https://api.agentmail.to';

async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!AGENTMAIL_API_KEY || !AGENTMAIL_INBOX_ID) {
    console.log(`[EmailWorker DRY-RUN] To: ${to} | Subject: ${subject}`);
    return;
  }

  const url = `${AGENTMAIL_API_BASE}/inboxes/${encodeURIComponent(AGENTMAIL_INBOX_ID)}/messages/send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      text: text || subject,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AgentMail API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  console.log(`[EmailWorker] Sent email to ${to}: ${subject} (message_id: ${data.message_id})`);
}

const worker = new Worker(
  'emails',
  async (job: Job) => {
    console.log(`[EmailWorker] Processing job ${job.id}: ${job.name}`);

    switch (job.data.type) {
      case 'verification':
        await sendEmail(
          job.data.to,
          'ShopBuilder — Verify Your Email',
          `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px;">${job.data.data.code}</div>
          <p style="color:#666;font-size:14px;">This code expires in 10 minutes.</p>
        </div>
      `,
          `Your verification code is: ${job.data.data.code}`,
        );
        break;
      case 'password-reset':
        await sendEmail(
          job.data.to,
          'ShopBuilder — Reset Your Password',
          `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Password Reset</h2>
          <p>Click below to reset your password:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${job.data.data.resetLink}" style="background:#4CAF50;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;">Reset Password</a>
          </div>
          <p style="color:#666;font-size:14px;">This link expires in 1 hour.</p>
        </div>
      `,
          `Reset your password: ${job.data.data.resetLink}`,
        );
        break;
      case 'order-confirmation': {
        const order = job.data.data;
        const itemsHtml = (order.items || [])
          .map(
            (item: any) =>
              `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.title}</td><td style="padding:8px;text-align:center;">${item.quantity}</td><td style="padding:8px;text-align:right;">${item.price}</td></tr>`,
          )
          .join('');
        await sendEmail(
          job.data.to,
          `ShopBuilder — Order ${order.orderNumber} Confirmed`,
          `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Order Confirmation</h2>
          <p>Order <strong>${order.orderNumber}</strong> placed successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;"><thead><tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Product</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead><tbody>${itemsHtml}</tbody></table>
          <div style="text-align:right;font-size:18px;font-weight:bold;">Total: ${order.total}</div>
        </div>
      `,
          `Order ${order.orderNumber} confirmed. Total: ${order.total}`,
        );
        break;
      }
      case 'payment-receipt': {
        const pay = job.data.data;
        await sendEmail(
          job.data.to,
          `ShopBuilder — Payment Receipt for ${pay.orderNumber}`,
          `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Payment Receipt</h2>
          <table style="width:100%;margin:20px 0;">
            <tr><td style="padding:8px;color:#666;">Order</td><td style="padding:8px;">${pay.orderNumber}</td></tr>
            <tr><td style="padding:8px;color:#666;">Amount</td><td style="padding:8px;">${pay.amount}</td></tr>
            <tr><td style="padding:8px;color:#666;">Provider</td><td style="padding:8px;">${pay.provider}</td></tr>
          </table>
        </div>
      `,
          `Payment receipt for ${pay.orderNumber}. Amount: ${pay.amount}`,
        );
        break;
      }
      default:
        throw new Error(`Unknown email job type: ${job.data.type}`);
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    },
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed: ${err.message}`);
});

worker.on('ready', () => {
  console.log('[EmailWorker] Email worker ready and listening');
});

console.log('[EmailWorker] Starting email processor...');
