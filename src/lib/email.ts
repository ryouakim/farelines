import nodemailer from 'nodemailer'
import { formatCurrency, formatDate, getFareTypeDisplay } from '@/lib/utils'
import type { Trip, PriceAlert } from '@/types/trip'

// Create transporter
const createTransporter = () => {
  // Check if we're using SendGrid or Gmail
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  } else {
    throw new Error('No email configuration found')
  }
}

// Email templates
const emailTemplates = {
  welcome: (userName: string) => ({
    subject: 'Welcome to Farelines - Start Saving on Flights!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Farelines</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .feature { padding: 15px; border-left: 3px solid #0891b2; margin: 15px 0; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to Farelines!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your journey to smarter flight savings starts here</p>
            </div>
            <div class="content">
              <p>Hi ${userName || 'Traveler'},</p>
              
              <p>Thank you for joining Farelines! You're now part of a community of smart travelers who never overpay for flights.</p>
              
              <h2 style="color: #1e293b;">Here's how to get started:</h2>
              
              <div class="feature">
                <strong>1. Add Your First Trip</strong><br>
                Upload your confirmation email or paste your Google Flights booking URL
              </div>
              
              <div class="feature">
                <strong>2. Set Your Preferences</strong><br>
                Choose your alert threshold - we'll only notify you when savings exceed this amount
              </div>
              
              <div class="feature">
                <strong>3. Relax & Save</strong><br>
                We'll monitor prices 24/7 and alert you instantly when your fare drops
              </div>
              
              <div style="text-align: center;">
                <a href="https://farelines.com/app/trips/new" class="button">Add Your First Trip</a>
              </div>
              
              <p><strong>Did you know?</strong> Airlines frequently adjust prices, and our users save an average of $350 per trip by catching these price drops!</p>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy travels and happy savings!</p>
              
              <p>Best regards,<br>The Farelines Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Farelines. All rights reserved.</p>
              <p>
                <a href="https://farelines.com/privacy" style="color: #0891b2; text-decoration: none;">Privacy Policy</a> | 
                <a href="https://farelines.com/terms" style="color: #0891b2; text-decoration: none;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  priceAlert: (alert: PriceAlert & { trip: Trip }) => ({
    subject: `🎉 Price Drop Alert: Save ${formatCurrency(alert.savings)} on your ${alert.trip.tripName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Price Drop Alert</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: linear-gradient(135deg, #10b981 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .savings-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .price-comparison { display: flex; justify-content: space-around; margin: 20px 0; }
            .price-item { text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .flight-details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert-header">
              <h1 style="margin: 0;">💰 Price Dropped!</h1>
              <p style="margin: 10px 0 0 0; font-size: 20px;">Your flight just got cheaper!</p>
            </div>
            <div class="content">
              <div class="savings-box">
                <h2 style="color: #10b981; margin: 0;">You can save ${formatCurrency(alert.savings)}!</h2>
                <p style="margin: 10px 0 0 0; font-size: 18px;">That's ${alert.percentSaved.toFixed(1)}% off your original price</p>
              </div>
              
              <h3>Trip: ${alert.trip.tripName}</h3>
              <p>PNR: <strong>${alert.trip.recordLocator}</strong></p>
              
              <div class="price-comparison">
                <div class="price-item">
                  <p style="color: #6b7280; margin: 0;">You Paid</p>
                  <p style="font-size: 24px; font-weight: bold; margin: 5px 0; text-decoration: line-through; color: #ef4444;">
                    ${formatCurrency(alert.paidPrice)}
                  </p>
                </div>
                <div class="price-item">
                  <p style="color: #6b7280; margin: 0;">Current Price</p>
                  <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #10b981;">
                    ${formatCurrency(alert.currentPrice)}
                  </p>
                </div>
              </div>
              
              <div class="flight-details">
                <p style="margin: 0;"><strong>Fare Type:</strong> ${getFareTypeDisplay(alert.fareType)}</p>
                <p style="margin: 5px 0 0 0;"><strong>Flights:</strong></p>
                ${alert.trip.flights.map(f => `
                  <p style="margin: 5px 0 0 20px;">• ${f.flightNumber} - ${f.origin} to ${f.destination} on ${formatDate(f.date)}</p>
                `).join('')}
              </div>
              
              <h3>What to do next:</h3>
              <ol>
                <li>Contact your airline or travel agent with your PNR</li>
                <li>Request a refund for the fare difference</li>
                <li>Many airlines offer travel credits or refunds for price drops within 24 hours of booking</li>
              </ol>
              
              ${alert.googleFlightsUrl ? `
                <div style="text-align: center;">
                  <a href="${alert.googleFlightsUrl}" class="button">View on Google Flights</a>
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="https://farelines.com/app/trips/${alert.tripId}" class="button">View Trip Details</a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                <strong>Pro Tip:</strong> Act quickly! Airlines may have time limits on price adjustment requests. 
                Check your airline's policy for details.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Farelines. All rights reserved.</p>
              <p>
                <a href="https://farelines.com/app/settings" style="color: #0891b2; text-decoration: none;">Manage Notifications</a> | 
                <a href="https://farelines.com/privacy" style="color: #0891b2; text-decoration: none;">Privacy Policy</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
}

// Send email function
export async function sendEmail(
  to: string,
  template: 'welcome' | 'priceAlert',
  data?: any
) {
  try {
    const transporter = createTransporter()
    const from = process.env.SENDGRID_FROM || process.env.EMAIL_FROM || process.env.GMAIL_USER
    
    let emailContent
    
    switch (template) {
      case 'welcome':
        emailContent = emailTemplates.welcome(data?.userName || '')
        break
      case 'priceAlert':
        emailContent = emailTemplates.priceAlert(data)
        break
      default:
        throw new Error('Invalid email template')
    }
    
    const mailOptions = {
      from: `Farelines <${from}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail(email, 'welcome', { userName })
}

// Send price alert email
export async function sendPriceAlertEmail(alert: PriceAlert & { trip: Trip }) {
  return sendEmail(alert.userEmail, 'priceAlert', alert)
}
