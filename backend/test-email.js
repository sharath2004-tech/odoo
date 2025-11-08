// Test email configuration
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('\n🧪 Testing Email Configuration...\n');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Password:', process.env.EMAIL_PASSWORD ? '****' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('Use Gmail:', process.env.USE_GMAIL);
console.log('Email Enabled:', process.env.ENABLE_EMAIL);

async function testEmail() {
  try {
    console.log('\n📧 Creating transporter...');
    
    const transporter = nodemailer.createTransport({
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

    console.log('✅ Transporter created');
    console.log('\n🔐 Verifying connection...');
    
    await transporter.verify();
    
    console.log('✅ Connection verified successfully!');
    console.log('\n✉️ Sending test email...');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '✅ Workzen HRMS - Email Test Successful',
      html: `
        <h2>🎉 Email Configuration Working!</h2>
        <p>Your email configuration is working correctly.</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>You can now create employee accounts and they will receive welcome emails automatically!</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 SUCCESS! Check your inbox:', process.env.EMAIL_USER);
    console.log('\nYou can now use the employee onboarding feature!\n');
    
  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️ AUTHENTICATION FAILED!');
      console.error('Your password is incorrect or not an App Password.');
      console.error('\nTo fix:');
      console.error('1. Go to: https://myaccount.google.com/apppasswords');
      console.error('2. Generate a 16-character App Password');
      console.error('3. Update EMAIL_PASSWORD in .env file');
      console.error('4. Run this test again: node test-email.js\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⚠️ CONNECTION TIMEOUT!');
      console.error('Your network/firewall is blocking Gmail SMTP.');
      console.error('Try disabling firewall temporarily or check network settings.\n');
    } else {
      console.error('\nUnexpected error occurred.\n');
    }
  }
}

testEmail();
