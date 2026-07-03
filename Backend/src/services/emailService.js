import path from "path";
import transporter from "../config/mail.js"
import loadTemplate from "../utils/templateEngine.js";

const sendVerificationMail = async ({ name, email, otp }) => {

  const otpDigitsHTML = otp
    .toString()
    .split("")
    .map((d) => `<div class="otp-digit">${d}</div>`)
    .join("");

  const html = loadTemplate(
    path.join(process.cwd(), "src/templates/verifyEmail.html"),
    {
      name,
      email,
      otp: otpDigitsHTML,
      supportEmail: "farmfresh.admin@gmail.com",
      otpExpiry: 10
    });

  await transporter.sendMail({
    from: `"FarmFresh" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "AUTH | FarmFresh : Verify your email",
    html
  });

};

export default sendVerificationMail;