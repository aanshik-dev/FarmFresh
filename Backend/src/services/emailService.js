import path from "path";
import transporter from "../config/mail.js";
import loadTemplate from "../utils/templateEngine.js";

const sendVerificationMail = async ({ name, email, otp }) => {
  const otpDigitsHTML = otp
    .toString()
    .split("")
    .map(
      (d) =>
        `<td width="46" height="58" align="center" valign="middle" style="background-color:#ffffff; border:1.5px solid #6ee7b7; border-radius:10px; font-family:'Courier New', Courier, monospace; font-size:26px; font-weight:700; color:#065f46; padding-left:10px; padding-right:10px;">${d}</td>`,
    )
    .join("");

  const html = loadTemplate(
    path.join(process.cwd(), "src/templates/verifyEmail.html"),
    {
      name,
      email,
      otp_digits: otpDigitsHTML,
      otp,
      supportEmail: "farmfresh.admin@gmail.com",
      otpExpiry: 10,
    },
  );

  await transporter.sendMail({
    from: `"FarmFresh" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `FarmFresh | Verify your email with OTP: ${otp}`,
    html,
  });
};

export default sendVerificationMail;
