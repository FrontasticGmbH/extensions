import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Account } from '../../types/account/Account';

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

  //Use this for debugging/testing purposes
  async initTest() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    this.transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  async sendEmail(data: { from: string; to: string; subject?: string; text?: string; html?: string }) {
    const { from, to, text, html, subject } = data;
    return await this.transport.sendMail({ from, to, subject, text, html });
  }

  async sendVerificationEmail(account: Account) {
    //Verification url
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3000' : process.env.client_host;
    const path = `verify?token=${account.confirmationToken}`;
    const url = `${host}/${path}`;
    const html = `
                  <h1>Thanks for your registration!</h1>
                  <p style="margin-top: 10px;color:gray;">Please activate your account by clicking the below link</p>
                  <a href="${url}">${url}</a>
                `;
    await this.sendEmail({
      from: 'no-reply@frontastic.cloud',
      to: account.email,
      subject: 'Account verification',
      html,
    });
  }
}
