// src/lib/emails/send.ts - Email service for API routes

import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPriceDropEmail({
  to,
  tripName,
  recordLocator,
  oldPrice,
  newPrice,
  savings,
  fareType,
  googleFlightsUrl,
  flights,
}: {
  to: string;
  tripName: string;
  recordLocator: string;
  oldPrice: number;
  newPrice: number;
  savings: number;
  fareType: string;
  googleFlightsUrl?: string;
  flights: any[];
}) {
  const flightDetails = flights
    .map((f) => `${f.origin} → ${f.destination} on ${f.date}`)
    .join('<br>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0070f3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: white; }
        .savings { background: #e6f7ff; padding: 15px; border-left: 4px solid #0070f3; margin: 20px 0; }
        .button { background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Price Drop Alert!</h1>
          <h2>${tripName}</h2>
        </div>
        
        <div class="content">
          <p><strong>Great news!</strong> The price for your trip has dropped.</p>
          
          <p><strong>Booking Reference:</strong> ${recordLocator}</p>
          
          <p><strong>Flight Details:</strong><br>${flightDetails}</p>
          
          <div class="savings">
            <h3>💰 Price Update</h3>
            <p><strong>You Paid:</strong> $${oldPrice.toFixed(2)}</p>
            <p><strong>Current Price:</strong> $${newPrice.toFixed(2)}</p>
            <p><strong>You Save:</strong> $${savings.toFixed(2)}</p>
            <p><strong>Fare Type:</strong> ${fareType.replace(/_/g, ' ')}</p>
          </div>
          
          ${googleFlightsUrl ? `<a href="${googleFlightsUrl}" class="button">View on Google Flights</a>` : ''}
          
          <p><small>You're receiving this because you're monitoring this trip on Farelines.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Farelines" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `💰 Save $${savings.toFixed(2)} on your ${tripName} trip!`,
      html,
    });
    
    console.log(`Price drop email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0070f3; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to Farelines! ✈️</h1>
      </div>
      <div style="padding: 20px;">
        <p>Hi ${name},</p>
        <p>Welcome to Farelines! We're excited to help you save money on flights you've already booked.</p>
        <p>Start by adding your first trip to begin monitoring prices.</p>
        <p>Happy travels!</p>
        <p><strong>The Farelines Team</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Farelines" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Welcome to Farelines - Start Saving on Your Flights! ✈️',
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}