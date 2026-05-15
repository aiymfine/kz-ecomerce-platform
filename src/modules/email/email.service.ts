import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string | null = null;
  private inboxId: string | null = null;
  private appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AGENTMAIL_API_KEY') || this.configService.get<string>('SMTP_PASSWORD') || null;
    this.inboxId = this.configService.get<string>('AGENTMAIL_INBOX_ID') || this.configService.get<string>('SMTP_USER') || null;
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3001');

    if (this.apiKey && this.inboxId) {
      this.logger.log('EmailService configured with AgentMail API');
    } else {
      this.logger.warn(
        'AgentMail not configured — emails will be logged but not sent. Set AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID (or SMTP_PASSWORD/SMTP_USER).',
      );
    }
  }

  private async sendMail(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!this.apiKey || !this.inboxId) {
      this.logger.warn(
        `[EMAIL DRY-RUN] To: ${to} | Subject: ${subject}\n${html.substring(0, 200)}...`,
      );
      return;
    }

    try {
      const url = `https://api.agentmail.to/inboxes/${encodeURIComponent(this.inboxId)}/messages/send`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
      this.logger.log(`Email sent to ${to}: ${subject} (message_id: ${data.message_id})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering with ShopBuilder!</p>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not register, please ignore this email.</p>
      </div>
    `;
    await this.sendMail(email, 'ShopBuilder — Verify Your Email', html, `Your verification code is: ${code}`);
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>You requested a password reset for your ShopBuilder account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `;
    await this.sendMail(email, 'ShopBuilder — Reset Your Password', html, `Reset your password: ${resetLink}`);
  }

  async sendOrderConfirmation(
    email: string,
    orderDetails: {
      orderNumber: string;
      items: Array<{ title: string; sku: string; quantity: number; price: number }>;
      total: number;
      currency?: string;
    },
  ): Promise<void> {
    const currency = orderDetails.currency || 'KZT';
    const itemsHtml = orderDetails.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title} (${item.sku})</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.price / 100).toFixed(2)} ${currency}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Thank you for your order! Your order <strong>${orderDetails.orderNumber}</strong> has been placed successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; font-size: 18px; font-weight: bold;">
          Total: ${(orderDetails.total / 100).toFixed(2)} ${currency}
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">We will notify you when your order ships.</p>
      </div>
    `;
    await this.sendMail(email, `ShopBuilder — Order ${orderDetails.orderNumber} Confirmed`, html);
  }

  async sendPaymentReceipt(
    email: string,
    paymentDetails: {
      orderNumber: string;
      amount: number;
      provider: string;
      transactionId?: string;
      currency?: string;
    },
  ): Promise<void> {
    const currency = paymentDetails.currency || 'KZT';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Receipt</h2>
        <p>Your payment has been received.</p>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; color: #666;">Order</td><td style="padding: 8px; font-weight: bold;">${paymentDetails.orderNumber}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Amount</td><td style="padding: 8px; font-weight: bold;">${(paymentDetails.amount / 100).toFixed(2)} ${currency}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Provider</td><td style="padding: 8px;">${paymentDetails.provider}</td></tr>
          ${paymentDetails.transactionId ? `<tr><td style="padding: 8px; color: #666;">Transaction ID</td><td style="padding: 8px;">${paymentDetails.transactionId}</td></tr>` : ''}
        </table>
      </div>
    `;
    await this.sendMail(
      email,
      `ShopBuilder — Payment Receipt for ${paymentDetails.orderNumber}`,
      html,
    );
  }
}
