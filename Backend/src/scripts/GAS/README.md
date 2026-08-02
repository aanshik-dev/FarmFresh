# FarmFresh - Google Apps Script (GAS) Email Service Setup

## How It Works
- **If `GAS_URL` is set** (e.g. in Production / Deployment environment variables): The backend calls Google Apps Script to send emails.
- **If `GAS_URL` is empty/not set** (e.g. on Localhost): The backend uses standard Nodemailer + Gmail SMTP.

---

## 1. Deploy the Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/).
2. Create a **New Project** named `FarmFresh Mailer`.
3. Copy the code from [`Backend/src/scripts/GAS/Code.gs`](file:///d:/Coding/production/FarmFresh/Backend/src/scripts/GAS/Code.gs) into your Apps Script editor.
4. Click **Deploy** -> **New deployment**.
5. Select type: **Web app**.
6. Settings:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
7. Click **Deploy** and copy the **Web App URL**.

---

## 2. Environment Variable

On your deployment server (Render, Vercel, etc.):

```env
GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

That's it!
- On **Localhost**: Leave `GAS_URL` commented out or blank -> Nodemailer is used.
- On **Deployment**: Add `GAS_URL` in environment settings -> Google Apps Script is used.
