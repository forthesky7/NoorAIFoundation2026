import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

const SYSTEM_PROMPT = `You are NOOR, an intelligent and encouraging AI tutor for students. 
Your role is to help students understand educational content they are watching. 
Be concise, clear, and supportive. When testing comprehension:
- Ask follow-up questions if the student seems confused
- Praise correct answers warmly
- Gently correct misconceptions
- Keep responses under 150 words
- Determine if the student understood (set understood: true if they demonstrate understanding)`;

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    
    const { message, history = [] } = parsed.data;
    
    const lowerMessage = message.toLowerCase();
    const understoodKeywords = ["yes", "understand", "got it", "i see", "makes sense", "clear", "understood"];
    const confusedKeywords = ["no", "confused", "don't understand", "not sure", "what", "help"];
    
    let understood = understoodKeywords.some(k => lowerMessage.includes(k));
    
    const responses = [
      { reply: "Great question! Let me help you think through this. Based on what you just watched, can you explain the main concept in your own words?", understood: false },
      { reply: "Excellent understanding! You've grasped the core idea perfectly. You're ready to continue watching.", understood: true },
      { reply: "That's a good start! Think about how this connects to what we learned earlier. Does that help clarify things?", understood: false },
      { reply: "Perfect! You've shown excellent comprehension. Let's continue with the video.", understood: true },
    ];
    
    let reply: string;
    if (confusedKeywords.some(k => lowerMessage.includes(k))) {
      reply = "No worries! Let's break this down step by step. The key point from this section is that knowledge builds on itself. Can you tell me one thing you did understand from this part?";
      understood = false;
    } else if (understood) {
      reply = "Excellent! Your understanding is spot on. You're ready to continue with the video. Keep up the great work!";
    } else if (lowerMessage.length < 10) {
      reply = "Could you elaborate a bit more? I want to make sure you've fully grasped this concept before we move on.";
      understood = false;
    } else {
      const idx = Math.floor(Date.now() / 1000) % responses.length;
      const r = responses[idx];
      reply = r.reply;
      understood = r.understood;
    }
    
    return res.json({ reply, understood });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
