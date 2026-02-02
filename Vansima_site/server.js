import express from "express";
import Stripe from "stripe";
import cors from "cors";
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Replace this with your actual Stripe secret key from your dashboard   
import dotenv from 'dotenv';
dotenv.config();

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: 'application/json' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public')); // for your front-end files

// ✅ Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
  const { product } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product || "Vansima Digital Product" },
            unit_amount: 2998, // $29.98
          },
          quantity: 1,
        },
      ],
      success_url: "https://vansima.us/success.html",
      cancel_url: "https://vansima.us/cancel.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
// Apple Pay / Payment Request Button route
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount = 3999, currency = 'usd' } = req.body; // 39.99 USD default
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Stripe webhook for secure fulfillment
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_YOUR_WEBHOOK_SECRET'); // 🔒 Replace with your webhook secret
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

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
  }

  res.status(200).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Vansima server running on port ${PORT}`));


