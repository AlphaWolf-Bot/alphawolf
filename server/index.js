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

// ✅ **1. Health Check Endpoint**
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// ✅ **2. Server Status**
app.get("/status", (req, res) => {
  res.json({ success: true, status: "Server is active" });
});

// ✅ **3. Telegram Authentication (POST)**
app.post("/auth/telegram", async (req, res) => {
  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ success: false, message: "Missing initData" });
  }

  try {
    // ✅ Verify Telegram Auth
    const user = verifyTelegramAuth(initData);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Save user data in Supabase
    const { data, error } = await supabase
      .from("users")
      .upsert([{ telegramId: user.id, username: user.username }])
      .select("*"); // Ensure data is returned

    if (error) {
      return res.status(500).json({ success: false, message: "Database error", error });
    }

    return res.json({ success: true, user: data[0] || {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ **Telegram Auth Verification (FIX THIS FUNCTION)**
function verifyTelegramAuth(initData) {
  try {
    // ✅ Add actual Telegram validation logic
    return { id: "12345", username: "testuser" }; // Dummy data (Replace with real logic)
  } catch (error) {
    return null;
  }
}

// ✅ **4. Get User Data**
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

// ✅ **5. Update Coins**
app.post("/user/update-coins", async (req, res) => {
  const { telegramId, coins } = req.body;

  const { error } = await supabase
    .from("users")
    .update({ coins })
    .eq("telegramId", telegramId);

  if (error) return res.status(500).json({ success: false, message: "Database error", error });

  res.json({ success: true, message: "Coins updated successfully!" });
});

// ✅ **6. Referral System**
app.post("/user/refer", async (req, res) => {
  const { referrerId, referredUsername } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegramId", referrerId)
    .single();

  if (error || !data) return res.status(404).json({ message: "Referrer not found" });

  const updatedReferrals = [...(data.referredUsers || []), { username: referredUsername, level: 1 }];
  const { error: updateError } = await supabase
    .from("users")
    .update({ referredUsers: updatedReferrals })
    .eq("telegramId", referrerId);

  if (updateError) return res.status(500).json({ success: false, message: "Database error", updateError });

  res.json({ success: true, message: "Referral added successfully!" });
});

// ✅ **7. Admin Panel Access**
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

// ✅ **8. Approve/Reject Withdrawals**
app.post("/admin/withdraw", async (req, res) => {
  const { telegramId, status } = req.body;
  if (status === "approved") {
    return res.json({ success: true, message: "Withdrawal Approved" });
  } else {
    return res.json({ success: true, message: "Withdrawal Rejected" });
  }
});

// ✅ **9. Update Social Media Links**
app.post("/admin/update-links", async (req, res) => {
  const { links } = req.body;
  const { error } = await supabase
    .from("settings")
    .update({ twitter: links.twitter, instagram: links.instagram })
    .eq("id", 1);

  if (error) return res.status(500).json({ success: false, message: "Database error", error });

  res.json({ success: true, message: "Links Updated" });
});

// ✅ **10. Update Coin Image**
app.post("/admin/update-coin", async (req, res) => {
  const { coinImage } = req.body;
  const { error } = await supabase.from("settings").update({ coinImage }).eq("id", 1);

  if (error) return res.status(500).json({ success: false, message: "Database error", error });

  res.json({ success: true, message: "Coin Image Updated" });
});

// ✅ **Start Server**
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
