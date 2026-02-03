import express from "express";
import cors from "cors";
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Replace this with your actual Stripe secret key from your dashboard   
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: 'application/json' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public')); // for your front-end files

    // Generate a secure expiring link (for example, expires in 24h)
    const uniqueLink = `https://vansima.com/downloads/${session.id}?token=${Math.random().toString(36).substring(2, 15)}`;

    // Email the buyer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'support@vansima.com', // replace with your sender email
        pass: 'your-app-password',      // app password (not your normal password)
      },
    });

    const mailOptions = {
      from: 'Vansima <yourbusiness@gmail.com>',
      to: customerEmail,
      subject: 'Your Vansima Digital Download',
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Here’s your secure download link (expires in 24 hours):</p>
        <a href="${uniqueLink}">Download Your Product</a>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent to', customerEmail);
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }
  

  res.status(200).send();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Vansima server running on port ${PORT}`));


