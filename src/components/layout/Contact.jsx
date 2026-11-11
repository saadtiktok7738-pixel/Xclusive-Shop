import React, { useState } from "react";
import { Layout } from "../bonents/mainpage/Layout.jsx";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { toast } from "sonner";

const PHONE_PATTERN = /^[0-9+()\-\s]{0,20}$/;

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || website) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Please enter your name (2–100 characters).");
      return;
    }
    if (!trimmedEmail || trimmedEmail.length > 254) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (trimmedMessage.length < 5 || trimmedMessage.length > 2000) {
      toast.error("Please enter a message (5–2000 characters).");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "messages"), {
        name: trimmedName,
        email: trimmedEmail,
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
        message: trimmedMessage,
        createdAt: serverTimestamp(),
      });

      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Helmet>
  <title>Contact Us | Xclusive Shop</title>

  <meta
    name="description"
    content="Get in touch with Xclusive Shop. Contact us for support, orders, and inquiries. We are available 24/7 to help you."
  />

  <meta
    name="keywords"
    content="contact Xclusive Shop, customer support, help, inquiry, Pakistan online store contact"
  />

  {/* Open Graph */}
  <meta property="og:title" content="Contact Us | Xclusive Shop" />
  <meta
    property="og:description"
    content="Reach out to Xclusive Shop for support and inquiries. We are here to help."
  />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Xclusive Shop" />

  {/* Twitter */}
  <meta name="twitter:title" content="Contact Us | Xclusive Shop" />
  <meta
    name="twitter:description"
    content="Contact Xclusive Shop for support and inquiries."
  />
</Helmet>
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Contact Us</h1>

        <p className="text-muted-foreground text-sm md:text-base mb-10">
          We're here to help. Reach out through any of the channels below and our team will get back to you promptly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={16} className="text-accent" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Phone</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Call or WhatsApp us anytime during business hours.
            </p>
            <a
              href="tel:+923001234567"
              className="text-sm font-semibold hover:text-accent transition-colors"
            >
              +92 300 1234567
            </a>
          </div>

          <div className="border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={16} className="text-accent" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Email</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Send us a message and we'll reply within 24 hours.
            </p>
            <a
              href="mailto:hello@mslal.pk"
              className="text-sm font-semibold hover:text-accent transition-colors"
            >
              hello@mslal.pk
            </a>
          </div>

          <div className="border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-accent" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Location</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Visit our store during operating hours.
            </p>
            <p className="text-sm font-semibold">
              Plot 123, Gulberg III, Lahore, Pakistan
            </p>
          </div>

          <div className="border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-accent" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Business Hours</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Our team is available:
            </p>
            <p className="text-sm font-semibold">Mon – Sat: 10am – 8pm</p>
            <p className="text-sm text-muted-foreground">Sunday: Closed</p>
          </div>
        </div>

        <div className="bg-muted/50 border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle size={16} className="text-accent" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Send us a message</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder="e.g. 0300 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={5}
                maxLength={2000}
                rows={5}
                className="w-full border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="How can we help you?"
              />
            </div>

            <div className="hidden" aria-hidden="true">
              <label>
                Leave this field empty
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
    </>
  );
}
