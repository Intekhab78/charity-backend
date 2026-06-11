const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email using Nodemailer
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping email to:", to);
    return;
  }
  
  if (!to || !to.includes('@')) {
    console.warn("Invalid email address provided:", to);
    return;
  }

  const mailOptions = {
    from: `"Charity Dashboard" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email to", to, ":", error);
  }
};

/**
 * Send Booking Success Email to Customer
 */
exports.sendBookingSuccessEmail = async (customerEmail, customerName, bookingDetails, shares = []) => {
  const bookingId = bookingDetails.id || bookingDetails.uuid || 'N/A';
  const subject = `Qurbani Booking Confirmed - #${bookingId}`;
  
  let sharesHtml = '';
  if (shares && shares.length > 0) {
    sharesHtml = `
      <h4 style="margin: 20px 0 10px; color: #0f172a; border-bottom: 2px solid #10b981; display: inline-block; padding-bottom: 4px;">Share Details</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Reg No</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Beneficiary</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${shares.map(s => `
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${s.share_reg_no || 'Pending'}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${s.beneficiary_name || 'N/A'}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">₹${s.amount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Booking Confirmed!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">JazakAllah Khair for your Qurbani booking</p>
      </div>
      
      <div style="padding: 30px; background-color: #f8fafc; color: #334155; line-height: 1.6; font-size: 15px;">
        <p style="font-size: 16px;">Dear <strong style="color: #0f172a;">${customerName || 'Valued Customer'}</strong>,</p>
        <p>Your Qurbani booking has been successfully recorded in our system. Below are your booking details.</p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px; font-size: 18px;">Booking Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;">Booking ID:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">#${bookingId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Total Shares:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${bookingDetails.total_shares}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #10b981; font-size: 16px;">₹${bookingDetails.total_amount}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Payment Mode:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${bookingDetails.payment_mode}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #f59e0b;">${bookingDetails.is_approved_by_admin ? 'Approved' : 'Pending Admin Review'}</td></tr>
          </table>
          
          ${sharesHtml}
        </div>
        
        <p style="margin-top: 25px;">May Allah accept your sacrifice and reward you immensely.</p>
        <br/>
        <p style="margin: 0;">Warm regards,</p>
        <p style="margin: 5px 0; font-weight: bold; color: #0f172a;">Charity Administration Team</p>
      </div>
      <div style="background-color: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 13px; color: #64748b;">
        This is an automated email. Please do not reply directly to this message.
      </div>
    </div>
  `;

  await sendEmail(customerEmail, subject, html);
};

/**
 * Send Qurbani Completion Success Email to Customer and Admin
 */
exports.sendQurbaniSuccessEmail = async (customerEmail, adminEmail, customerName, shareDetails) => {
  const subject = `Qurbani Completed Successfully - Share ${shareDetails.share_reg_no || ''}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0ea5e9; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 24px;">Qurbani Completed!</h2>
      </div>
      <div style="padding: 20px; background-color: #f8fafc; color: #334155; line-height: 1.6;">
        <p>Dear <strong>${customerName || 'Valued Customer'}</strong>,</p>
        <p>Alhamdulillah! We are pleased to inform you that your Qurbani has been successfully performed.</p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Sacrifice Details</h3>
          <p style="margin: 5px 0;"><strong>Share Registration No:</strong> ${shareDetails.share_reg_no || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Beneficiary Name:</strong> ${shareDetails.beneficiary_name || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Completed</p>
        </div>
        
        <p>May Allah accept your Qurbani and grant you and your family immense blessings.</p>
        <br/>
        <p style="margin: 0;">Warm regards,</p>
        <p style="margin: 5px 0; font-weight: bold;">Charity Administration Team</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
        This is an automated email. Please do not reply directly to this message.
      </div>
    </div>
  `;

  // Send to Customer
  if (customerEmail && customerEmail.includes('@')) {
    await sendEmail(customerEmail, subject, html);
  }

  // Send to Admin
  if (adminEmail && adminEmail.includes('@')) {
    const adminSubject = `Admin Alert: Qurbani Completed - Share ${shareDetails.share_reg_no || ''}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>System Alert: Qurbani Executed</h3>
        <p>The system has successfully marked the following Qurbani share as completed:</p>
        <ul>
          <li><strong>Customer:</strong> ${customerName || 'N/A'}</li>
          <li><strong>Share Reg No:</strong> ${shareDetails.share_reg_no || 'N/A'}</li>
          <li><strong>Beneficiary:</strong> ${shareDetails.beneficiary_name || 'N/A'}</li>
        </ul>
      </div>
    `;
    await sendEmail(adminEmail, adminSubject, adminHtml);
  }
};

/**
 * Send Booking Approved Email to Customer
 */
exports.sendBookingApprovedEmail = async (customerEmail, customerName, bookingDetails) => {
  const bookingId = bookingDetails.id || bookingDetails.uuid || 'N/A';
  const subject = `Your Qurbani Booking is Approved! - #${bookingId}`;
  
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Booking Approved</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Your booking has been verified by the Admin</p>
      </div>
      
      <div style="padding: 30px; background-color: #f8fafc; color: #334155; line-height: 1.6; font-size: 15px;">
        <p style="font-size: 16px;">Dear <strong style="color: #0f172a;">${customerName || 'Valued Customer'}</strong>,</p>
        <p>Your recent Qurbani booking has been reviewed and successfully approved by our administration team.</p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px; font-size: 18px;">Approved Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;">Booking ID:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">#${bookingId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Total Shares:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${bookingDetails.total_shares}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #8b5cf6; font-size: 16px;">₹${bookingDetails.total_amount}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #10b981;">Fully Approved</td></tr>
          </table>
        </div>
        
        <p style="margin-top: 25px;">We will notify you again once the Qurbani is performed. JazakAllah Khair for your trust.</p>
        <br/>
        <p style="margin: 0;">Warm regards,</p>
        <p style="margin: 5px 0; font-weight: bold; color: #0f172a;">Charity Administration Team</p>
      </div>
      <div style="background-color: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 13px; color: #64748b;">
        This is an automated email. Please do not reply directly to this message.
      </div>
    </div>
  `;

  if (customerEmail && customerEmail.includes('@')) {
    await sendEmail(customerEmail, subject, html);
  }
};
