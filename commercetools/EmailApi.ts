import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Account } from '../../types/account/Account';

export class EmailApi {
  //email transporter
  transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  //sender email
  sender: string;

  constructor(credentials: {
    host: string;
    port: number;
    encryption: string;
    user: string;
    password: string;
    sender: string;
  }) {
    //set sender email
    this.sender = credentials.sender;
    //initialize transporter
    this.transport = nodemailer.createTransport({
      host: credentials.host,
      port: +credentials.port,
      secure: credentials.port == 465,
      auth: {
        user: credentials.user,
        pass: credentials.password,
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

  getUrl(token: string, relPath: string) {
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3000' : process.env.client_host;
    const path = `${relPath}?token=${token}`;
    const url = `${host}/${path}`;
    return url;
  }

  async sendEmail(data: { to: string; subject?: string; text?: string; html?: string }) {
    const from = this.sender;
    const { to, text, html, subject } = data;
    return await this.transport.sendMail({ from, to, subject, text, html });
  }

  async sendVerificationEmail(account: Account) {
    if (!account.confirmationToken) return; //no valid confirmation token
    //Verification url
    const url = this.getUrl(account.confirmationToken, 'verify');
    //message content
    const html = `
                  <h1>Thanks for your registration!</h1>
                  <p style="margin-top: 10px;color:gray;">Please activate your account by clicking the below link</p>
                  <a href="${url}">${url}</a>
                `;
    //send email
    try {
      await this.sendEmail({
        to: account.email,
        subject: 'Account Verification',
        html,
      });
    } catch (error) {}
  }

  async sendPasswordResetEmail(token: string, email: string) {
    if (!token) return; //not a valid token
    //Password reset URL
    const url = this.getUrl(token, 'reset');
    //message content
    const html = `
                  <h1>You requested a password reset!</h1>
                  <p style="margin-top: 10px;color:gray;">Please click the link below to proceed.</p>
                  <a href="${url}">${url}</a>
                `;
    //send email
    await this.sendEmail({
      to: email,
      subject: 'Password Reset',
      html,
    });
  }
}
