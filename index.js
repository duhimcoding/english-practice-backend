import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// API route
app.post("/generate", async (req, res) => {
  const { mistake, type } = req.body;

  try {
    const prompt = `
Your trainer has provided this sentence with a grammar mistake:

"${mistake}" (Mistake type: ${type}).

🚫 RULES:
- DO NOT think aloud.
- DO NOT explain your thinking.
- DO NOT say "let me check", "maybe", "I think", "I will", or "I need".
- DO NOT mention the user.
- ONLY provide a clean final answer.

✅ What you must do:

1. Write a SHORT explanation (2-4 sentences) explaining the grammar mistake and how to fix it.
2. Then give exactly 5 short, incorrect example sentences for the student to correct.

✅ Strict format you must follow:

---
Explanation:
[Short explanation here.]

Exercises:
1. [Incorrect sentence]
2. [Incorrect sentence]
3. [Incorrect sentence]
4. [Incorrect sentence]
5. [Incorrect sentence]
---

✅ Focus only on grammar mistakes.
✅ Ignore typos.
✅ Speak directly to the student ("Your trainer provided...").
✅ DO NOT stop halfway.
✅ NO extra talking, no thoughts, no planning aloud.
✅ Only clean final output in the format shown.
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "deepseek/deepseek-chat", // 👈 Using deepseek-chat
        messages: [
          {
            role: "system",
            content: "You are a strict English teacher. You only deliver clean grammar explanations and exercises. No thinking aloud. No extra text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 600,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:5173",
          "Content-Type": "application/json",
          "X-Title": "EnglishPracticeApp"
        }
      }
    );

    console.log("🔵 Full DeepSeek-Chat API Response:");
    console.dir(response.data, { depth: null });

    // ✅ Corrected here: now reading from message.content
    const exercise = response.data?.choices?.[0]?.message?.content?.trim();

    if (exercise) {
      res.json({ exercise });
    } else {
      console.log("⚠️ Warning: No exercise content found in response!");
      res.status(500).send("No exercise returned from AI.");
    }
  } catch (err) {
    console.error("🔴 Error:", err.response?.data || err.message);
    res.status(500).send("Something went wrong");
  }
});

// Start server
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});

