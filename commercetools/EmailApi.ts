import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class EmailApi {
  //email transporter
  transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    //initialize transporter
    this.transport = nodemailer.createTransport({
      host: process.env.smtp_host,
      port: +process.env.smtp_port,
      secure: process.env.smtp_port == '465',
      auth: {
        user: process.env.smtp_user,
        pass: process.env.smtp_password,
      },
    });
  }
  async sendEmail(data: { from: string; to: string; subject?: string; text?: string; html?: string }) {
    const { from, to, text, html, subject } = data;
    try {
      return await this.transport.sendMail({ from, to, subject, text, html });
    } catch (err) {}
  }
}
