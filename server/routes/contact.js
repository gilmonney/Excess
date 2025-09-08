const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { validateContact } = require('../middleware/validation');

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 contact form submissions per windowMs
  message: {
    success: false,
    error: 'Too many contact form submissions. Please try again later.'
  }
});

// Configure nodemailer
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use app password for Gmail
      }
    });
  } else {
    // Generic SMTP configuration
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

// POST /api/contact - Send contact form
router.post('/', contactLimiter, validateContact, async (req, res) => {
  try {
    const { name, email, subject, message, type = 'general' } = req.body;

    // Create email content
    const emailContent = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Excess Music] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000, #333); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Excess Music</h1>
            <p style="color: #ccc; margin: 10px 0 0 0;">New Contact Form Submission</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Name:</strong>
                <span style="margin-left: 10px;">${name}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Email:</strong>
                <span style="margin-left: 10px;"><a href="mailto:${email}" style="color: #007bff;">${email}</a></span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Type:</strong>
                <span style="margin-left: 10px; text-transform: capitalize;">${type}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Subject:</strong>
                <span style="margin-left: 10px;">${subject}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #555;">Message:</strong>
              </div>
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 10px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          
          <div style="background: #333; padding: 15px; text-align: center;">
            <p style="color: #ccc; margin: 0; font-size: 12px;">
              This email was sent from the Excess Music contact form.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Type: ${type}
Subject: ${subject}

Message:
${message}

---
This email was sent from the Excess Music contact form.
      `
    };

    // Auto-reply email
    const autoReplyContent = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Excess Music',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000, #333); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Excess Music</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333;">Thank you for your message!</h2>
              
              <p>Hi ${name},</p>
              
              <p>We've received your message and will get back to you as soon as possible. Here's a copy of what you sent:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <strong>Subject:</strong> ${subject}<br><br>
                <strong>Message:</strong><br>
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              <p>If you have any urgent inquiries, please don't hesitate to reach out to us directly.</p>
              
              <p>Best regards,<br>
              The Excess Music Team</p>
            </div>
          </div>
          
          <div style="background: #333; padding: 15px; text-align: center;">
            <p style="color: #ccc; margin: 0; font-size: 12px;">
              © 2025 Excess Music. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${name},

Thank you for contacting Excess Music!

We've received your message and will get back to you as soon as possible.

Here's a copy of what you sent:

Subject: ${subject}

Message:
${message}

Best regards,
The Excess Music Team
      `
    };

    // Only send emails if email configuration is available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = createTransporter();
      
      // Send notification email
      await transporter.sendMail(emailContent);
      
      // Send auto-reply
      await transporter.sendMail(autoReplyContent);
      
      res.json({
        success: true,
        message: 'Message sent successfully! We\'ll get back to you soon.'
      });
    } else {
      // Log the contact form submission when email is not configured
      console.log('Contact form submission (email not configured):', {
        name,
        email,
        subject,
        type,
        message,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
      
      res.json({
        success: true,
        message: 'Message received! We\'ll get back to you soon.'
      });
    }
    
  } catch (error) {
    console.error('Error sending contact form:', error);
    
    // Don't expose email configuration errors to the user
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.'
    });
  }
});

// GET /api/contact/info - Get contact information
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      email: 'contact@excessmusic.com',
      social: {
        instagram: 'https://instagram.com/excessmusic',
        twitter: 'https://twitter.com/excessmusic',
        soundcloud: 'https://soundcloud.com/excessmusic'
      },
      address: {
        city: 'Your City',
        country: 'Your Country'
      },
      businessHours: 'Monday - Friday, 9AM - 6PM',
      responseTime: '24-48 hours'
    }
  });
});

module.exports = router;
