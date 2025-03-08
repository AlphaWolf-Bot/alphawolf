import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabaseClient.js";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ **Fix: Remove JSX & Use JSON Response**
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// ✅ **Fix: Ensure All Routes Return JSON (No JSX)**
app.get("/status", (req, res) => {
  res.json({ success: true, status: "Server is active" });
});

// ✅ **1. Telegram Authentication**
app.get("/auth/telegram", async (req, res) => {
  try {
    const initData = req.query.initData;
    if (!initData) {
      console.error("❌ Missing initData from request");
      return res.status(400).json({ success: false, message: "Missing initData" });
    }

    console.log("✅ Received initData:", initData);
    res.json({ success: true, message: "Authorized", user: { telegramId: "123456789", username: "TestUser" } });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



// ✅ **2. Get User Data**
app.get("/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegramId", telegramId)
    .single();

  if (error || !data) return res.status(404).json({ message: "User not found" });
  res.json(data);
});

// ✅ **3. Update Coins**
app.post("/user/update-coins", async (req, res) => {
  const { telegramId, coins } = req.body;
  await supabase
    .from("users")
    .update({ coins })
    .eq("telegramId", telegramId);

  res.json({ success: true });
});

// ✅ **4. Referral System**
app.post("/user/refer", async (req, res) => {
  const { referrerId, referredUsername } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegramId", referrerId)
    .single();

  if (error || !data) return res.status(404).json({ message: "Referrer not found" });

  const updatedReferrals = [...(data.referredUsers || []), { username: referredUsername, level: 1 }];
  await supabase.from("users").update({ referredUsers: updatedReferrals }).eq("telegramId", referrerId);

  res.json({ success: true });
});

// ✅ **5. Admin Panel Access**
app.get("/admin/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegramId", telegramId)
    .single();

  if (error || !data || !data.isAdmin) {
    return res.status(403).json({ success: false, message: "Access Denied" });
  }
  res.json({ success: true, user: data });
});

// ✅ **6. Approve/Reject Withdrawals**
app.post("/admin/withdraw", async (req, res) => {
  const { telegramId, status } = req.body;
  if (status === "approved") {
    res.json({ success: true, message: "Withdrawal Approved" });
  } else {
    res.json({ success: true, message: "Withdrawal Rejected" });
  }
});

// ✅ **7. Update Social Media Links**
app.post("/admin/update-links", async (req, res) => {
  const { links } = req.body;
  await supabase.from("settings").update({ twitter: links.twitter, instagram: links.instagram }).eq("id", 1);
  res.json({ success: true, message: "Links Updated" });
});

// ✅ **8. Update Coin Image**
app.post("/admin/update-coin", async (req, res) => {
  const { coinImage } = req.body;
  await supabase.from("settings").update({ coinImage }).eq("id", 1);
  res.json({ success: true, message: "Coin Image Updated" });
});

// ✅ **Start Server**
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
