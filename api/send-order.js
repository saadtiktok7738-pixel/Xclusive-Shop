const SENDER_EMAIL = "xclusiveshop.pk@gmail.com";
const SENDER_NAME = "Xclusive Shop";

// ── Email templates ────────────────────────────────────────────────────────

function adminOrderTemplate(order) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;">
        ${item.name}${item.color ? ` <span style="color:#888888;font-size:12px;">(${item.color})</span>` : ""}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#111111;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:bold;color:#111111;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`
    )
    .join("");

  const shortId = order.shortId || (order.orderId || order.id || "").slice(0, 8).toUpperCase();
  const shipping = order.shipping ?? 0;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Order #${shortId}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#000000;padding:28px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:2px;font-weight:900;">XCLUSIVE SHOP</h1>
          <p style="color:#aaaaaa;margin:6px 0 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Admin Order Notification</p>
        </td></tr>
        <tr><td style="background:#18A558;padding:14px 40px;text-align:center;">
          <p style="color:#ffffff;margin:0;font-size:15px;font-weight:bold;">🛍️ New Order Received &nbsp;·&nbsp; #${shortId}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="color:#111111;font-size:13px;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #f0f0f0;padding-bottom:10px;">Customer Information</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;width:110px;">Name</td><td style="padding:5px 0;color:#111111;font-size:13px;font-weight:bold;">${order.name}</td></tr>
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">Email</td><td style="padding:5px 0;color:#111111;font-size:13px;">${order.email || "Not provided"}</td></tr>
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">Phone</td><td style="padding:5px 0;color:#111111;font-size:13px;">${order.phone}</td></tr>
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">City</td><td style="padding:5px 0;color:#111111;font-size:13px;">${order.city}</td></tr>
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">Address</td><td style="padding:5px 0;color:#111111;font-size:13px;">${order.address}</td></tr>
            ${order.note ? `<tr><td style="padding:5px 0;color:#666666;font-size:13px;">Note</td><td style="padding:5px 0;color:#111111;font-size:13px;font-style:italic;">${order.note}</td></tr>` : ""}
          </table>
          <h2 style="color:#111111;font-size:13px;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #f0f0f0;padding-bottom:10px;">Order Items</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:6px;overflow:hidden;margin-bottom:20px;">
            <tr style="background:#f8f8f8;">
              <th style="padding:10px 8px;text-align:left;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Product</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Price</th>
            </tr>
            ${itemsHtml}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">Subtotal</td><td style="padding:5px 0;color:#111111;font-size:13px;text-align:right;">Rs. ${(order.subtotal ?? order.total).toLocaleString()}</td></tr>
            <tr><td style="padding:5px 0;color:#666666;font-size:13px;">Shipping</td><td style="padding:5px 0;font-size:13px;text-align:right;${shipping === 0 ? "color:#18A558;font-weight:bold;" : "color:#111111;"}">${shipping === 0 ? "FREE" : "Rs. " + shipping.toLocaleString()}</td></tr>
            <tr><td colspan="2" style="padding:0;"><div style="border-top:2px solid #111111;margin:10px 0;"></div></td></tr>
            <tr><td style="padding:4px 0;color:#111111;font-size:16px;font-weight:bold;">TOTAL</td><td style="padding:4px 0;color:#111111;font-size:16px;font-weight:bold;text-align:right;">Rs. ${order.total.toLocaleString()}</td></tr>
          </table>
          <div style="background:#f8f8f8;border-radius:6px;padding:12px 16px;margin-top:20px;">
            <p style="margin:0;font-size:13px;color:#555555;">💳 <strong>Payment Method:</strong> Cash on Delivery (COD)</p>
          </div>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:11px;color:#aaaaaa;">Xclusive Shop Admin Panel &nbsp;·&nbsp; Automated Notification</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function customerOrderConfirmationTemplate(order) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#111111;">
        ${item.name}${item.color ? ` <span style="color:#888888;font-size:11px;">(${item.color})</span>` : ""}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f5;text-align:center;font-size:13px;color:#555555;">x${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f5;text-align:right;font-size:13px;font-weight:bold;color:#111111;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`
    )
    .join("");

  const shortId = order.shortId || (order.orderId || order.id || "").slice(0, 8).toUpperCase();
  const shipping = order.shipping ?? 0;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-PK", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Order Confirmed #${shortId}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#000000;padding:28px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:2px;font-weight:900;">XCLUSIVE SHOP</h1>
        </td></tr>
        <tr><td style="background:#18A558;padding:28px 40px;text-align:center;">
          <p style="font-size:40px;margin:0 0 10px;line-height:1;">✅</p>
          <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">Order Confirmed!</h2>
          <p style="color:#d4edda;margin:8px 0 0;font-size:14px;">Thank you for shopping with Xclusive Shop</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#111111;font-size:15px;margin:0 0 6px;">Hi <strong>${order.name}</strong>,</p>
          <p style="color:#555555;font-size:14px;line-height:1.7;margin:0 0 28px;">We've received your order and it's now being reviewed. We'll notify you as soon as it's processed and shipped!</p>
          <div style="background:#f8f8f8;border-left:4px solid #18A558;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Order ID:</strong> #${shortId}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Date:</strong> ${orderDate}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Payment:</strong> Cash on Delivery (COD)</p>
            <p style="margin:0;font-size:13px;color:#555555;"><strong>Status:</strong> <span style="color:#18A558;font-weight:bold;">Pending</span></p>
          </div>
          <h3 style="color:#111111;font-size:13px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Your Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:6px;overflow:hidden;margin-bottom:20px;">
            <tr style="background:#f8f8f8;">
              <th style="padding:8px;text-align:left;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Product</th>
              <th style="padding:8px;text-align:center;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Qty</th>
              <th style="padding:8px;text-align:right;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Price</th>
            </tr>
            ${itemsHtml}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:4px 0;color:#666666;font-size:13px;">Subtotal</td><td style="padding:4px 0;color:#111111;font-size:13px;text-align:right;">Rs. ${(order.subtotal ?? order.total).toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;color:#666666;font-size:13px;">Shipping</td><td style="padding:4px 0;font-size:13px;text-align:right;${shipping === 0 ? "color:#18A558;font-weight:bold;" : "color:#111111;"}">${shipping === 0 ? "FREE" : "Rs. " + shipping.toLocaleString()}</td></tr>
            <tr><td colspan="2" style="padding:0;"><div style="border-top:2px solid #111111;margin:8px 0;"></div></td></tr>
            <tr><td style="padding:4px 0;color:#111111;font-size:16px;font-weight:bold;">Total</td><td style="padding:4px 0;color:#111111;font-size:16px;font-weight:bold;text-align:right;">Rs. ${order.total.toLocaleString()}</td></tr>
          </table>
          <h3 style="color:#111111;font-size:13px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Delivery Address</h3>
          <div style="background:#f8f8f8;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:13px;color:#111111;font-weight:bold;">${order.name}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#555555;">${order.address}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#555555;">${order.city}</p>
            <p style="margin:0;font-size:13px;color:#555555;">${order.phone}</p>
          </div>
          <p style="color:#555555;font-size:13px;line-height:1.6;margin:0;padding:14px 18px;background:#fffbeb;border-radius:6px;border-left:4px solid #f59e0b;">
            📦 <strong>What's next?</strong> Our team will review your order shortly. You'll receive an email update when it ships with tracking information.
          </p>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
          <p style="margin:0 0 4px;font-size:12px;color:#888888;">Questions? Email us at <a href="mailto:xclusiveshop.pk@gmail.com" style="color:#111111;">xclusiveshop.pk@gmail.com</a></p>
          <p style="margin:0;font-size:11px;color:#aaaaaa;">© Xclusive Shop &nbsp;·&nbsp; Thank you for your order!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function statusUpdateTemplate(order, newStatus) {
  const statusConfig = {
    processing: { emoji: "⚙️", title: "Your order is being processed!", desc: "Great news! We've confirmed your order and our team is now carefully preparing it for shipment.", color: "#2563EB" },
    shipped: { emoji: "🚚", title: "Your order is on its way!", desc: "Your package has been handed to the courier and is heading your way. Keep an eye out for delivery!", color: "#7C3AED" },
    delivered: { emoji: "✅", title: "Order delivered successfully!", desc: "Your order has been delivered. We hope you love your new purchase! Feel free to shop with us again.", color: "#18A558" },
    cancelled: { emoji: "❌", title: "Your order has been cancelled", desc: "Your order has been cancelled. If you have any questions, please reach out to us and we'll be happy to help.", color: "#DC2626" },
  };

  const cfg = statusConfig[newStatus] || { emoji: "📦", title: `Order status updated: ${newStatus}`, desc: "Your order status has been updated.", color: "#111111" };
  const shortId = order.shortId || (order.orderId || order.id || "").slice(0, 8).toUpperCase();

  const itemsHtml = order.items
    .map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#111111;">${item.name}${item.color ? ` <span style="color:#888888;font-size:11px;">(${item.color})</span>` : ""}</td>
      <td style="padding:8px;border-bottom:1px solid #f5f5f5;text-align:center;font-size:13px;color:#555555;">x${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f5f5f5;text-align:right;font-size:13px;font-weight:bold;color:#111111;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Order Status Update</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#000000;padding:28px 40px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:2px;font-weight:900;">XCLUSIVE SHOP</h1></td></tr>
        <tr><td style="background:${cfg.color};padding:28px 40px;text-align:center;">
          <p style="font-size:40px;margin:0 0 10px;line-height:1;">${cfg.emoji}</p>
          <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:bold;">${cfg.title}</h2>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#111111;font-size:15px;margin:0 0 10px;">Hi <strong>${order.name}</strong>,</p>
          <p style="color:#555555;font-size:14px;line-height:1.7;margin:0 0 28px;">${cfg.desc}</p>
          <div style="background:#f8f8f8;border-left:4px solid ${cfg.color};border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Order ID:</strong> #${shortId}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Status:</strong> <span style="color:${cfg.color};font-weight:bold;text-transform:capitalize;">${newStatus}</span></p>
            <p style="margin:0;font-size:13px;color:#555555;"><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
          </div>
          <h3 style="color:#111111;font-size:13px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Your Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:6px;overflow:hidden;">${itemsHtml}</table>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
          <p style="margin:0 0 4px;font-size:12px;color:#888888;">Questions? Email us at <a href="mailto:xclusiveshop.pk@gmail.com" style="color:#111111;">xclusiveshop.pk@gmail.com</a></p>
          <p style="margin:0;font-size:11px;color:#aaaaaa;">© Xclusive Shop &nbsp;·&nbsp; Thank you for shopping with us</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function trackingTemplate(order, courier, trackingId) {
  const shortId = order.shortId || (order.orderId || order.id || "").slice(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Order Has Shipped!</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#000000;padding:28px 40px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:2px;font-weight:900;">XCLUSIVE SHOP</h1></td></tr>
        <tr><td style="background:#7C3AED;padding:28px 40px;text-align:center;">
          <p style="font-size:40px;margin:0 0 10px;line-height:1;">📦</p>
          <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:bold;">Your Order Has Shipped!</h2>
          <p style="color:#ddd6fe;margin:8px 0 0;font-size:13px;">Use the details below to track your package</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#111111;font-size:15px;margin:0 0 10px;">Hi <strong>${order.name}</strong>,</p>
          <p style="color:#555555;font-size:14px;line-height:1.7;margin:0 0 28px;">Your order is on its way! Use the tracking information below to follow your package every step of the way.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #7C3AED;border-radius:8px;overflow:hidden;margin-bottom:28px;">
            <tr><td style="padding:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:2px;">Courier Company</p>
              <p style="margin:0 0 20px;font-size:22px;font-weight:bold;color:#111111;">${courier}</p>
              <p style="margin:0 0 4px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:2px;">Tracking Number</p>
              <div style="background:#f5f3ff;border-radius:6px;padding:14px 20px;display:inline-block;">
                <p style="margin:0;font-size:22px;font-weight:bold;color:#7C3AED;letter-spacing:3px;">${trackingId}</p>
              </div>
            </td></tr>
          </table>
          <div style="background:#f8f8f8;border-radius:6px;padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Order ID:</strong> #${shortId}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#555555;"><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
            <p style="margin:0;font-size:13px;color:#555555;"><strong>Status:</strong> <span style="color:#7C3AED;font-weight:bold;">Shipped</span></p>
          </div>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
          <p style="margin:0 0 4px;font-size:12px;color:#888888;">Questions? Email us at <a href="mailto:xclusiveshop.pk@gmail.com" style="color:#111111;">xclusiveshop.pk@gmail.com</a></p>
          <p style="margin:0;font-size:11px;color:#aaaaaa;">© Xclusive Shop &nbsp;·&nbsp; Thank you for shopping with us</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Brevo send helper ──────────────────────────────────────────────────────

async function sendEmail(apiKey, to, subject, htmlContent) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      replyTo: { email: SENDER_EMAIL },
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${errText}`);
  }

  return res.json();
}

// ── Serverless handler ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { type, order, customerEmail } = req.body ?? {};

  const jsonError = (status, message) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: message }));
  };

  if (!type || !order) {
    return jsonError(400, "Missing required fields: type, order");
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "primemart2288@gmail.com";

  if (!BREVO_API_KEY) {
    console.error("[send-order] BREVO_API_KEY is not set");
    return jsonError(500, "Email service not configured");
  }

  const shortId = order.shortId || (order.orderId || order.id || "").slice(0, 8).toUpperCase();

  try {
    if (type === "order-placed") {
      await sendEmail(
        BREVO_API_KEY,
        ADMIN_EMAIL,
        `🛍️ New Order #${shortId} — ${order.name}`,
        adminOrderTemplate(order)
      );
    } else if (type === "customer-order-placed") {
      if (!customerEmail) return jsonError(400, "customerEmail is required for customer-order-placed");
      await sendEmail(
        BREVO_API_KEY,
        customerEmail,
        `✅ Order Confirmed #${shortId} — Xclusive Shop`,
        customerOrderConfirmationTemplate(order)
      );
    } else if (type === "status-update") {
      if (!customerEmail) return jsonError(400, "customerEmail is required for status-update");
      await sendEmail(
        BREVO_API_KEY,
        customerEmail,
        `Your Xclusive Shop Order #${shortId} — Status Update`,
        statusUpdateTemplate(order, order.status)
      );
    } else if (type === "tracking-added") {
      if (!customerEmail) return jsonError(400, "customerEmail is required for tracking-added");
      if (!order.courier || !order.trackingId) return jsonError(400, "order.courier and order.trackingId are required");
      await sendEmail(
        BREVO_API_KEY,
        customerEmail,
        `📦 Your Xclusive Shop Order #${shortId} Has Shipped!`,
        trackingTemplate(order, order.courier, order.trackingId)
      );
    } else {
      return jsonError(400, `Unknown email type: ${type}`);
    }

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("[send-order] Failed to send email:", err);
    jsonError(500, "Failed to send email");
  }
}
