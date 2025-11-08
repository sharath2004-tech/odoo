import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = async () => {
  // For testing: Use Ethereal Email (fake SMTP service)
  // To use real Gmail: Set USE_GMAIL=true in .env and provide App Password
  const useGmail = process.env.USE_GMAIL === 'true';
  
  if (useGmail) {
    // Gmail with App Password
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Ethereal Email for testing (no setup required)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

// Generate random password
export const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  let password = '';
  
  // Ensure password has at least: 1 uppercase, 1 lowercase, 1 number, 1 special char
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@#$%&*'[Math.floor(Math.random() * 6)];
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Send welcome email to new employee
export const sendWelcomeEmail = async (recipientEmail, fullName, password, loginId, adminEmail) => {
  try {
    const transporter = await createTransporter();
    
    // Email to employee
    const employeeMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: recipientEmail,
      subject: 'Welcome to Workzen HRMS - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #06b6d4, #3b82f6);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              padding: 30px;
              background-color: #f9fafb;
            }
            .credentials-box {
              background-color: white;
              border: 2px solid #06b6d4;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 10px 0;
              font-size: 14px;
            }
            .credential-label {
              font-weight: bold;
              color: #666;
            }
            .credential-value {
              color: #06b6d4;
              font-weight: bold;
              font-size: 16px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #06b6d4, #3b82f6);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Workzen HRMS!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            
            <p>Welcome to the team! Your employee account has been successfully created in our HRMS system.</p>
            
            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #06b6d4;">Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Login ID:</span><br>
                <span class="credential-value">${loginId}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span><br>
                <span class="credential-value">${recipientEmail}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Temporary Password:</span><br>
                <span class="credential-value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Login URL:</span><br>
                <a href="http://localhost:5173/login" style="color: #06b6d4;">http://localhost:5173/login</a>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong><br>
              For your security, please change your password immediately after logging in for the first time. 
              You can change your password by going to your Profile page after login.
            </div>
            
            <h3>What you can do in the HRMS system:</h3>
            <ul>
              <li>Mark your daily attendance (check-in/check-out)</li>
              <li>Apply for leaves and track leave balance</li>
              <li>View your payslips and salary details</li>
              <li>Update your profile information</li>
              <li>Access company announcements and policies</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173/login" class="button">Login to Your Account</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact your HR department or IT support.</p>
            
            <p>Best regards,<br>
            <strong>Workzen HRMS Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Workzen HRMS. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };
    
    // Email to admin (confirmation)
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: adminEmail,
      subject: `New Employee Account Created - ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #06b6d4, #3b82f6);
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              padding: 30px;
              background-color: #f9fafb;
            }
            .info-box {
              background-color: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>✅ Employee Account Created Successfully</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            
            <p>A new employee account has been successfully created in Workzen HRMS.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #06b6d4;">Employee Details</h3>
              <p><strong>Name:</strong> ${fullName}</p>
              <p><strong>Login ID:</strong> ${loginId}</p>
              <p><strong>Email:</strong> ${recipientEmail}</p>
              <p><strong>Status:</strong> Account active, welcome email sent</p>
            </div>
            
            <p>The employee has been sent a welcome email with their login credentials and instructions to change their password on first login.</p>
            
            <p>Best regards,<br>
            <strong>Workzen HRMS System</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated system notification.</p>
          </div>
        </body>
        </html>
      `
    };
    
    // Send both emails
    const info1 = await transporter.sendMail(employeeMailOptions);
    const info2 = await transporter.sendMail(adminMailOptions);
    
    // If using Ethereal (test email), show preview URL
    if (process.env.USE_GMAIL !== 'true') {
      console.log('📧 Preview employee email: ' + nodemailer.getTestMessageUrl(info1));
      console.log('📧 Preview admin email: ' + nodemailer.getTestMessageUrl(info2));
    }
    
    console.log(`✅ Welcome email sent to ${recipientEmail} and confirmation sent to ${adminEmail}`);
    return { success: true, message: 'Welcome emails sent successfully' };
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendWelcomeEmail,
  generatePassword
};
