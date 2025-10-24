import express from "express";
import Stripe from "stripe";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: "application/json" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static("public")); // static front-end folder

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
            product_data: { name: product.name || "Vansima Product" },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: product.qty || 1,
        },
      ],
      success_url: "https://vansima.us/success.html",
      cancel_url: "https://vansima.us/cancel.html",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
