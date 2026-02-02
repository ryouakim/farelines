// apps/worker/emailNotifier.js
const nodemailer = require('nodemailer');
const config = require('./config');

let transporter = null;

try {
  transporter = nodemailer.createTransport({
    host: config.EMAIL.SMTP_HOST,
    port: config.EMAIL.SMTP_PORT,
    secure: false,
    auth: {
      user: config.EMAIL.GMAIL_USER,
      pass: config.EMAIL.GMAIL_APP_PASSWORD,
    },
  });
} catch (error) {
  console.error('Email transporter setup failed:', error);
}

async function sendFareAlert(trip, alerts) {
  if (!transporter || !alerts.length) return { sent: false };

  const alert = alerts[0];
  const subject = `Price Drop Alert: Save $${alert.savings.toFixed(2)} on ${trip.tripName}`;
  
  const html = `
    <h1>🎉 Price Drop Alert!</h1>
    <h2>${trip.tripName}</h2>
    <p>PNR: ${trip.recordLocator}</p>
    <p>You paid: $${alert.paidPrice.toFixed(2)}</p>
    <p>Current price: $${alert.currentPrice.toFixed(2)}</p>
    <p><strong>You could save: $${alert.savings.toFixed(2)}</strong></p>
    ${trip.googleFlightsUrl ? `<a href="${trip.googleFlightsUrl}">View on Google Flights</a>` : ''}
  `;

  try {
    await transporter.sendMail({
      from: config.EMAIL.DEFAULT_FROM,
      to: trip.userEmail,
      subject,
      html,
    });
    
    console.log(`Alert sent to ${trip.userEmail}`);
    return { sent: true, messageId: 'success' };
  } catch (error) {
    console.error('Email send failed:', error);
    return { sent: false, error };
  }
}

module.exports = { sendFareAlert };