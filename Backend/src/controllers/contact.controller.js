import Contact from "../models/contact.model.js";
import { sendContactMail } from "../services/email.service.js";

export const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are all required fields.",
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Save submission to database
    const newContact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      status: "PENDING",
    });

    // Try forwarding email to farmfresh.admin@gmail.com
    try {
      await sendContactMail({ name, email, message });
      newContact.status = "FORWARDED";
      await newContact.save();
    } catch (emailErr) {
      console.error("Failed to dispatch contact notification email:", emailErr.message);
      newContact.status = "FAILED";
      await newContact.save();
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for reaching out! Your message has been sent to our coordination team.",
      contactId: newContact._id,
    });
  } catch (error) {
    next(error);
  }
};
