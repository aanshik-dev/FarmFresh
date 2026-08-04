import path from "path";
import transporter from "../config/mail.js";
import loadTemplate from "../utils/templateEngine.js";

const sendVerificationMail = async ({ name, email, otp, goal }) => {
  const otpDigitsHTML = otp
    .toString()
    .split("")
    .map(
      (d) =>
        `<td width="46" height="58" align="center" valign="middle" style="background-color:#ffffff; border:1.5px solid #6ee7b7; border-radius:10px; font-family:'Courier New', Courier, monospace; font-size:26px; font-weight:700; color:#065f46; padding-left:10px; padding-right:10px;">${d}</td>`,
    )
    .join("");

  let templateName = "verifyEmail.html";
  let subject = `FarmFresh | Verify your email with OTP: ${otp}`;

  if (goal === "FORGOT_PASS") {
    templateName = "forgotPassword.html";
    subject = `FarmFresh | Reset your password with OTP: ${otp}`;
  }

  const html = loadTemplate(
    path.join(process.cwd(), "src/templates", templateName),
    {
      name,
      email,
      otp_digits: otpDigitsHTML,
      otp,
      supportEmail: "farmfresh.admin@gmail.com",
      otpExpiry: 20,
    },
  );

  const gasUrl =
    process.env.GAS_URL ||
    "https://script.google.com/macros/s/AKfycbwVPFndih7_MpodsQka40BzdUjXAHZ-qzv3NnDXrb7e4YTA5FS8C5M45jP_6ntV18zguw/exec";

  if (gasUrl) {
    try {
      console.log(
        `[Email Service] Sending email via Google Apps Script to: ${email}`,
      );
      await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          otp,
          html,
        }),
        redirect: "follow",
      });
      console.log(
        `[Email Service] Verification email sent to ${email} via GAS`,
      );
    } catch (err) {
      console.error(
        "[Email Service] GAS email failed, falling back to Nodemailer:",
        err.message,
      );
      await transporter.sendMail({
        from: `"FarmFresh" <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
    }
  } else {
    await transporter.sendMail({
      from: `"FarmFresh" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(
      `[Email Service] Verification email sent to ${email} via Nodemailer`,
    );
  }
};

export const sendContactMail = async ({ name, email, message }) => {
  const adminEmail = "farmfresh.admin@gmail.com";
  const subject = `FarmFresh | New Contact Form Inquiry from ${name}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #10b981;">
        <h2 style="color: #059669; margin: 0; font-size: 24px;">FarmFresh Contact Inquiry</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="margin: 8px 0; font-size: 15px;"><strong>Sender Name:</strong> ${name}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
        <p style="margin: 8px 0; font-size: 13px; color: #64748b;"><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; margin: 16px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">Message Content:</h4>
        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
      </div>
      <div style="padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        This message was automatically forwarded from the FarmFresh Contact Us page.
      </div>
    </div>
  `;

  const gasUrl =
    process.env.GAS_URL ||
    "https://script.google.com/macros/s/AKfycbwVPFndih7_MpodsQka40BzdUjXAHZ-qzv3NnDXrb7e4YTA5FS8C5M45jP_6ntV18zguw/exec";

  if (gasUrl) {
    try {
      console.log(
        `[Email Service] Forwarding contact message from ${email} to ${adminEmail} via GAS`,
      );
      await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          name: `Contact: ${name}`,
          email: adminEmail,
          subject,
          html,
        }),
        redirect: "follow",
      });
      console.log(
        `[Email Service] Contact email forwarded to ${adminEmail} via GAS`,
      );
    } catch (err) {
      console.error(
        "[Email Service] GAS contact email failed, falling back to Nodemailer:",
        err.message,
      );
      await transporter.sendMail({
        from: `"FarmFresh Contact" <${process.env.GMAIL_USER || adminEmail}>`,
        replyTo: email,
        to: adminEmail,
        subject,
        html,
      });
    }
  } else {
    await transporter.sendMail({
      from: `"FarmFresh Contact" <${process.env.GMAIL_USER || adminEmail}>`,
      replyTo: email,
      to: adminEmail,
      subject,
      html,
    });
    console.log(
      `[Email Service] Contact email forwarded to ${adminEmail} via Nodemailer`,
    );
  }
};

export default sendVerificationMail;

