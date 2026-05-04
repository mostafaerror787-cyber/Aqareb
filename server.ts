import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy transporter initialization
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn("SMTP credentials missing. Email services offline.");
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "STRIKE_SUCCESS", 
      message: "Agrab Colony Neural Link Active.",
      version: "1.0.4-alpha"
    });
  });

  app.post("/api/notify", async (req, res) => {
    const { email, customerName, orderId, status, items, total } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Transmission target (email) missing." });
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      return res.status(503).json({ error: "Neural link to SMTP relay offline. Configure environment variables." });
    }

    try {
      let subject = "";
      let html = "";

      if (status === 'pending') {
        subject = `AGRAB SECTOR: TRANSMISSION RECEIVED #${orderId}`;
        html = `
          <div style="background: #000; color: #fff; font-family: monospace; padding: 40px; border: 1px solid #ccff00;">
            <h1 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px;">ORDER_CONFIRMED : ${orderId}</h1>
            <p>Greetings, ${customerName}.</p>
            <p>Your request has been integrated into the colony buffer. Deployment sequence initiated.</p>
            <div style="margin: 20px 0; border: 1px solid #333; padding: 20px;">
              <h3 style="color: #666;">PAYLOAD_SUMMARY</h3>
              ${items.map((it: any) => `<p style="margin: 5px 0;">[${it.quantity}x] ${it.name} - SIZE: ${it.size}</p>`).join('')}
              <hr style="border: 0; border-top: 1px solid #333;" />
              <p style="font-weight: bold; color: #ccff00;">TOTAL_PAYLOAD: EGP ${total}</p>
            </div>
            <p style="color: #666; font-size: 10px; margin-top: 40px;">// SYSTEM_AUTH: AGRAB_CORE_V1</p>
          </div>
        `;
      } else {
        subject = `AGRAB SECTOR: UNIT_STATUS_UPDATE #${orderId}`;
        html = `
          <div style="background: #000; color: #fff; font-family: monospace; padding: 40px; border: 1px solid #ccff00;">
            <h1 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px;">STATUS_UPDATE : ${status.toUpperCase()}</h1>
            <p>Order Reference: ${orderId}</p>
            <p>Your tactical deployment status has changed to: <span style="color: #ccff00;">${status.toUpperCase()}</span></p>
            <p style="margin-top: 20px;">Deploying to: ${customerName}</p>
            <p style="color: #666; font-size: 10px; margin-top: 40px;">// SYSTEM_AUTH: AGRAB_CORE_V1</p>
          </div>
        `;
      }

      await mailTransporter.sendMail({
        from: `"AGRAB_SECTOR" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject,
        html,
      });

      res.json({ success: true, message: "Transmission successfully relayed." });
    } catch (error) {
      console.error("Email Relay Failure:", error);
      res.status(500).json({ error: "Quantum packet collision. Transmission failed." });
    }
  });

  app.get("/api/stats", (req, res) => {
    // This is a placeholder. In a production app, you might fetch this from Firestore Admin SDK
    res.json({
      active_sectors: ["Upperwear", "T-Shirts", "Bottoms"],
      system_status: "OPTIMAL",
      colony_load: "LIGH"
    });
  });

  // Example API endpoint for orders
  app.get("/api/ping", (req, res) => {
    res.json({ 
      timestamp: new Date().toISOString(),
      signal: "PULSE"
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
