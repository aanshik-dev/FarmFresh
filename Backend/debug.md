# 🐛 Debug: `POST /api/auth/get-otp` returning 500

## The Request You Sent

```json
{
  "role": "COLLECTIVE",
  "leadFarmer": "Ratan",
  "phone": "8596586956",
  "email": "aanshiksinghtomar@gmail.com"
}
```

---

## Tracing the Flow

Let's walk through every function your request touches, in order:

### Step 1 — `authController.js` → calls `authService.sendOtp(req.body)` ✅

No issue here. It just forwards `req.body` to the service.

---

### Step 2 — `authService.sendOtp(data)` → checks user, generates OTP, saves PendingSignup, sends email

```javascript
const { role, leadFarmer, phone, email } = data;
// ... checks, generates OTP, saves to DB ...
await sendVerificationMail({ leadFarmer, email, otp });
```

Notice: it passes `leadFarmer` to `sendVerificationMail`. ✅ so far.

---

### Step 3 — `emailService.js` → **🔴 THIS IS THE BUG**

Look at the function signature:

```javascript
const sendVerificationMail = async ({ name, email, otp }) => { ... }
```

It destructures `name` from the incoming object. But `authService.js` passes `leadFarmer`:

```javascript
await sendVerificationMail({ leadFarmer, email, otp });
//                           ^^^^^^^^^^
//                           Key is "leadFarmer", not "name"
```

So inside `emailService.js`, the variable `name` is `undefined`. Then in the template it injects `undefined` as the name — this alone won't crash it, but it's a mismatch you should fix.

**However, the actual 500 crash is most likely from `transporter.sendMail()`** — check your nodemon console log for the real error. The most common reasons:

1. **Gmail auth failure** — your `GMAIL_APP_PASS` in `.env` may be invalid/expired. Gmail App Passwords are 16 chars, yours is `pbvw pwao hymn oooj` (16 chars with spaces, which is correct format). But if this account doesn't have 2FA + App Passwords enabled, it will reject.

2. **The `from` email doesn't match `GMAIL_USER`** — yours look aligned (`farmfresh.admin@gmail.com`), so this is probably fine.

---

## 🩹 The Fix

### Fix 1: Parameter name mismatch (definite bug)

In **`authService.js` line 38**, change:

```diff
- await sendVerificationMail({ leadFarmer, email, otp });
+ await sendVerificationMail({ name: leadFarmer, email, otp });
```

**Why:** `emailService.js` expects `{ name, email, otp }` but you're passing `{ leadFarmer, email, otp }`. JavaScript destructuring means `name` ends up as `undefined`.

### Fix 2: Add a `console.error` to see the actual crash reason

In **`authController.js`**, temporarily add logging inside the catch:

```diff
  } catch (err) {
+   console.error("GET-OTP ERROR:", err);
    res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
```

This will print the **real error** to your terminal. Right now you're swallowing it and only sending a generic 500 to the client, so you can't see what actually failed.

### Fix 3: If it's still 500 after Fix 1 — Gmail credentials

Check your terminal after Fix 2. If you see something like:

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

Then your Gmail App Password is wrong or expired. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords), generate a new one, and update `.env`.

---

## Summary

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `authService.js` | 38 | Passes `leadFarmer` key, but `emailService.js` expects `name` |
| 2 | `authController.js` | 7-10 | No `console.error` — you can't see the real crash reason |
| 3 | `.env` | 5 | Possibly expired Gmail App Password (verify after adding logs) |

**Start with Fix 1, add Fix 2, re-test. The terminal output will tell you if Fix 3 is needed.**

---

# 🐛 Debug: `POST /api/auth/register` (Registration Workflow & Cloudinary)

I've traced the entire registration workflow from `index.js` -> `authRoutes.js` -> `authController.js` -> `authService.js` -> `uploadImage.js` -> Cloudinary. 

## ☁️ Cloudinary Image Upload (The Good News)
The core logic for image upload inside `utils/uploadImage.js` and how it's handled in `authService.js` is **structurally correct**. 
1. `multer.memoryStorage()` correctly provides `file.buffer`.
2. `streamifier.createReadStream(buffer).pipe(stream)` is the standard, correct way to upload a buffer to Cloudinary's `upload_stream`.
3. If the upload fails, it is properly caught in the `catch (uploadError)` block, allowing the registration to complete gracefully (with an empty profile string) instead of crashing the server.

However, there are a few **critical bugs in the adjacent registration data handling** that will cause `500 Internal Server Errors` before or after the image upload.

## 🔴 BUG 1: The `crops` array crash (CRITICAL)
In `authService.js`, you accept `crops = []` from `req.body`.
Since this is a `multipart/form-data` request, if the frontend sends only **one** crop (e.g., `crops=WHT`), `multer` parses it as a **String**, not an Array.

In `addCrops`, you loop over it:
```javascript
for (const cropCode of crops) {
```
If `crops` is `"WHT"`, this loop iterates over the characters `'W'`, `'H'`, `'T'`, causing it to crash with `Crop with id: 'W' not found !!`.

**🩹 Fix in `authService.js` inside `addCrops`:**
```javascript
const addCrops = async ({ ownerId, crops, MappingModel, ownerField, session }) => {
  if (!crops || crops.length === 0) return;
  
  // 1. Force it to be an array
  const cropsArray = Array.isArray(crops) ? crops : [crops];

  const cropDocs = await Crop.find({
    code: { $in: cropsArray }, // 2. Use cropsArray here
  }).session(session);

  // ...
  // 3. Use cropsArray in the loop
  for (const cropCode of cropsArray) { 
```

## 🔴 BUG 2: Mongoose update without `$set`
After the Cloudinary upload succeeds, you do:
```javascript
await FarmerGroup.updateOne({ _id: newUserId }, { profile: profileUrl });
```
While Mongoose 5+ implicitly wraps this in `$set` in most cases, passing an object directly without update operators is dangerous and can sometimes overwrite the document depending on strictness settings. 

**🩹 Fix in `authService.js` (Lines ~301 & ~306):**
```javascript
await FarmerGroup.updateOne(
  { _id: newUserId },
  { $set: { profile: profileUrl } }
);
```

## 🔴 BUG 3: Typo in `Collective` address schema
In `authService.js` when saving a `COLLECTIVE` (line ~258), you pass `pinCode`:
```javascript
address: { area, city, state, pinCode } // <-- Capital C
```
But in `models/collective.model.js`, the schema strictly expects `pincode` (lowercase 'c').
**🩹 Fix:** Change it to `pincode: pinCode` in `authService.js` when building the Collective object.

## 🔴 BUG 4: Missing OTP presence check
In `verifyOtp`, you do:
```javascript
const isOtpValid = await bcrypt.compare(otp, pendingSignup.hashOtp);
```
If the frontend forgets to send `otp`, `otp` is `undefined`. `bcrypt.compare` will instantly crash the app with a 500 error because it requires strings.
**🩹 Fix:** Add `if (!otp) throw new Error("OTP is required")` before `bcrypt.compare`.

