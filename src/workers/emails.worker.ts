// Email Sending Worker
// Queue: emails:send
// Job data: { to: string, subject: string, template: string, data: any }
//
// When BullMQ is installed, this will be registered as:
//   new Worker('emails:send', processor, { connection: redis })
//
// For now, this is a stub that logs what it would do.

export class EmailsWorker {
  async process(job: {
    to: string;
    subject: string;
    template: string;
    data: any;
  }) {
    console.log(
      `[EmailsWorker] Would send email to ${job.to}: "${job.subject}" (template: ${job.template})`,
    );
    // TODO: Render template with data using the TemplatesService
    // TODO: Send via SMTP or email provider (SendGrid, Mailgun, etc.)
    // TODO: Retry on transient failures
    // TODO: Track delivery status
  }
}

export function startEmailsWorker() {
  console.log('[EmailsWorker] Stub started — awaiting BullMQ integration');
}
