// packages/core/src/email.ts
// Email service using Gmail SMTP

import nodemailer from 'nodemailer';
import { formatCurrency, formatDate } from '@/lib/utils';

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // App-specific password
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email service ready');
  }
});

/**
 * Send price drop alert email
 */
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
    .map((f) => `${f.origin} → ${f.destination} on ${formatDate(f.date)}`)
    .join('<br>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .price-box { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .price-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .old-price { text-decoration: line-through; color: #888; }
        .new-price { color: #16a34a; font-size: 24px; font-weight: bold; }
        .savings { background: #16a34a; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
        .btn { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .flight-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Price Drop Alert!</h1>
          <p style="margin: 0; font-size: 18px;">Great news about your trip</p>
        </div>
        
        <div class="content">
          <h2>${tripName}</h2>
          <p><strong>Booking Reference:</strong> ${recordLocator}</p>
          
          <div class="flight-details">
            <strong>Flight Details:</strong><br>
            ${flightDetails}
          </div>
          
          <div class="price-box">
            <h3 style="margin-top: 0;">Price Update</h3>
            <div class="price-row">
              <span>Your Paid Price:</span>
              <span class="old-price">${formatCurrency(oldPrice)}</span>
            </div>
            <div class="price-row">
              <span>Current Price:</span>
              <span class="new-price">${formatCurrency(newPrice)}</span>
            </div>
            <div style="text-align: center;">
              <span class="savings">You could save ${formatCurrency(savings)}!</span>
            </div>
            <p style="text-align: center; color: #666; margin: 10px 0;">
              Fare Type: ${fareType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
          
          ${
            googleFlightsUrl
              ? `
          <div style="text-align: center;">
            <a href="${googleFlightsUrl}" class="btn">Rebook on Google Flights</a>
            <p style="color: #666; font-size: 14px;">
              Click above to view and potentially rebook your flight at the lower price.
            </p>
          </div>
          `
              : ''
          }
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>⚠️ Important:</strong> Flight prices change frequently. This price may not be available by the time you check.
            Act quickly if you want to take advantage of this lower fare.
          </div>
          
          <div class="footer">
            <p>You're receiving this because you're monitoring this trip on Farelines.</p>
            <p>
              <a href="https://farelines.com/app/account" style="color: #667eea;">Manage notification settings</a> |
              <a href="https://farelines.com/app/trips/${recordLocator}" style="color: #667eea;">View trip details</a>
            </p>
            <p>© ${new Date().getFullYear()} Farelines. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Price Drop Alert for ${tripName}
    
    Good news! The price for your trip has dropped.
    
    Booking Reference: ${recordLocator}
    
    Your Paid Price: ${formatCurrency(oldPrice)}
    Current Price: ${formatCurrency(newPrice)}
    You could save: ${formatCurrency(savings)}
    
    Flight Details:
    ${flights.map((f) => `${f.origin} → ${f.destination} on ${formatDate(f.date)}`).join('\n')}
    
    ${googleFlightsUrl ? `Rebook on Google Flights: ${googleFlightsUrl}` : ''}
    
    Note: Flight prices change frequently. This price may not be available by the time you check.
    
    Manage your notifications: https://farelines.com/app/account
  `;

  try {
    await transporter.sendMail({
      from: `"Farelines" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `💰 Save ${formatCurrency(savings)} on your ${tripName} trip!`,
      text,
      html,
    });
    
    console.log(`Price drop email sent to ${to} for trip ${recordLocator}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .step { display: flex; align-items: start; margin: 20px 0; }
        .step-number { background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
        .btn { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Farelines! ✈️</h1>
          <p style="margin: 0; font-size: 18px;">Start saving on your booked flights today</p>
        </div>
        
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>Welcome to Farelines! We're excited to help you save money on flights you've already booked.</p>
          
          <h3>How it works:</h3>
          
          <div class="step">
            <div class="step-number">1</div>
            <div>
              <strong>Add Your Trip</strong><br>
              Enter your flight details and the price you paid. Include the Google Flights URL for best results.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div>
              <strong>We Monitor Prices</strong><br>
              Our system checks prices regularly for the same flights and fare types.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div>
              <strong>Get Alerts</strong><br>
              When prices drop below your threshold, we'll email you immediately so you can rebook.
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://farelines.com/app/trips/new" class="btn">Add Your First Trip</a>
          </div>
          
          <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0;">💡 Pro Tips:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Add trips as soon as you book them</li>
              <li>Include the Google Flights booking URL for most accurate tracking</li>
              <li>Set a reasonable threshold (we recommend $50-100)</li>
              <li>Check your email regularly for price drop alerts</li>
            </ul>
          </div>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Happy travels and happy savings!</p>
          
          <p><strong>The Farelines Team</strong></p>
          
          <div class="footer">
            <p>
              <a href="https://farelines.com/app" style="color: #667eea;">Go to Dashboard</a> |
              <a href="https://farelines.com/app/account" style="color: #667eea;">Account Settings</a> |
              <a href="https://farelines.com/help" style="color: #667eea;">Help Center</a>
            </p>
            <p>© ${new Date().getFullYear()} Farelines. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Farelines" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Welcome to Farelines - Start Saving on Your Flights! ✈️',
      text: `Welcome to Farelines, ${name}! Start adding your trips to monitor for price drops.`,
      html,
    });
    
    console.log(`Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export default {
  sendPriceDropEmail,
  sendWelcomeEmail,
};
