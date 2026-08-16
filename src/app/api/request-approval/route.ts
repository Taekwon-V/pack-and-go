import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { uid, email } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const approvalUrl = `http://localhost:3000/api/approve?uid=${uid}`;

    const info = await transporter.sendMail({
      from: '"Tour App" <no-reply@tourapp.local>',
      to: 'inchul17.kim@gmail.com',
      subject: 'New User Approval Request',
      text: `User ${email} has requested access. Approve here: ${approvalUrl}`,
      html: `<p>User <b>${email}</b> has requested access.</p><p><a href="${approvalUrl}">Click here to approve</a></p>`,
    });

    console.log('Approval email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending approval email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
