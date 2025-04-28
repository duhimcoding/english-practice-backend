import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://english-practice-app-eosin.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

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
        model: "deepseek/deepseek-chat-v3-0324:free",
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
          "HTTP-Referer": "https://english-practice-app-eosin.vercel.app",
          "Content-Type": "application/json",
          "X-Title": "EnglishPracticeApp"
        }
      }
    );

    const exercise = response.data?.choices?.[0]?.message?.content?.trim();

    if (exercise) {
      res.json({ exercise });
    } else {
      res.status(500).send("No exercise returned from AI.");
    }
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

