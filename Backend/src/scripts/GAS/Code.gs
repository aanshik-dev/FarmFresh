/**
 * FarmFresh Google Apps Script for sending Emails/OTP
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open https://script.google.com/ and create a new project named "FarmFresh Emailer".
 * 2. Replace the contents of Code.gs with this code.
 * 3. Click "Deploy" -> "New deployment".
 * 4. Select type: "Web app".
 * 5. Configuration:
 *    - Description: FarmFresh OTP Mailer
 *    - Execute as: "Me (your-google-account@gmail.com)"
 *    - Who has access: "Anyone"  <-- CRITICAL for backend POST requests
 * 6. Click "Deploy", authorize permissions when prompted.
 * 7. Copy the Web App URL and set it in your Backend .env as `GAS_URL`.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "No post data received" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var email = data.email;
    var subject = data.subject || "FarmFresh OTP Code";
    var htmlBody = data.html;

    if (!email) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Recipient email is required" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!htmlBody) {
      // Fallback HTML string if raw HTML template was not supplied
      var name = data.name || "User";
      var otp = data.otp || "";
      htmlBody = "<div style='font-family:sans-serif; padding:20px;'>" +
        "<h2>FarmFresh Verification</h2>" +
        "<p>Hello <b>" + name + "</b>,</p>" +
        "<p>Your OTP code is: <b style='font-size:24px; color:#059669;'>" + otp + "</b></p>" +
        "</div>";
    }

    // Send email using GmailApp service
    GmailApp.sendEmail(email, subject, "", {
      htmlBody: htmlBody,
      name: "FarmFresh Admin"
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Email sent successfully" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("FarmFresh Google Apps Script Mailer Service is Running.");
}
