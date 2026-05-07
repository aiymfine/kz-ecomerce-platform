import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Simple email transport (standalone, not using NestJS DI)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"ShopBuilder" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`[EmailWorker] Sent email to ${to}: ${subject}`);
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
