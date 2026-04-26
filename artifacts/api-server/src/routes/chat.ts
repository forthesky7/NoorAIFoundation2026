import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

type HistoryItem = { role: string; content: string };

function buildSocraticReply(
  message: string,
  history: HistoryItem[],
  isCheckpoint: boolean,
  lang: "ar" | "en",
  videoTitle?: string
): { reply: string; understood: boolean } {
  const lower = message.toLowerCase().trim();
  const wordCount = message.trim().split(/\s+/).length;

  const arUnderstoodKeywords = ["فهمت", "أفهم", "واضح", "نعم", "صح", "صحيح", "أعرف", "أعلم", "بالضبط", "تمام", "إيه", "آه", "فاهم"];
  const arConfusedKeywords = ["لا", "مش فاهم", "ما فهمت", "ما عرفت", "مو واضح", "ما أدري", "ماذا", "هاه", "لا أفهم", "مش واضح"];
  const enUnderstoodKeywords = ["yes", "understand", "got it", "i see", "makes sense", "clear", "understood", "correct", "right", "exactly", "i know"];
  const enConfusedKeywords = ["no", "confused", "don't understand", "not sure", "what", "idk", "no idea", "unclear"];

  const understoodKw = lang === "ar" ? arUnderstoodKeywords : enUnderstoodKeywords;
  const confusedKw = lang === "ar" ? arConfusedKeywords : enConfusedKeywords;

  const isConfused = confusedKw.some(k => lower.includes(k));
  const claimsUnderstood = understoodKw.some(k => lower.includes(k));
  const isTooShort = wordCount < 4;
  const hasSubstantialAnswer = wordCount >= 6;

  // Video-specific context for more targeted questions
  const titleContext = videoTitle ? (lang === "ar" ? `في درس "${videoTitle}"` : `in the lesson "${videoTitle}"`) : "";

  if (lang === "ar") {
    if (isConfused) {
      return {
        reply: `لا بأس، الاستفسار دليل على التفكير!\n\nدعني أساعدك بسؤال أبسط ${titleContext}: **ما الفكرة الرئيسية الواحدة** التي لاحظتها في هذا الجزء؟ حتى لو كانت غير مكتملة، أخبرني.`,
        understood: false,
      };
    }
    if (isTooShort && isCheckpoint) {
      return {
        reply: `إجابة جيدة كبداية! لكن أريد أن أرى عمق فهمك أكثر ${titleContext}.\n\n**اشرح لي** كيف تربط هذه الفكرة بما تعلمته قبلها؟`,
        understood: false,
      };
    }
    if (claimsUnderstood && !hasSubstantialAnswer && isCheckpoint) {
      return {
        reply: `جميل أنك تشعر بالفهم! لإثبات ذلك ${titleContext}، **أعد صياغة الفكرة بكلماتك الخاصة** دون النظر إلى الفيديو. أنا هنا أستمع.`,
        understood: false,
      };
    }
    if (hasSubstantialAnswer && isCheckpoint) {
      const turns = history.filter(h => h.role === "user").length;
      if (turns >= 2) {
        return {
          reply: `ممتاز جداً! 🌟 لقد أثبتت فهماً عميقاً ${titleContext}. واصل هذا المستوى من التفكير النقدي!`,
          understood: true,
        };
      }
      return {
        reply: `تحليل رائع ${titleContext}! سؤال أخير للتأكيد: **كيف يمكنك تطبيق هذا المفهوم** في حياتك أو دراستك؟`,
        understood: false,
      };
    }
    if (!isCheckpoint) {
      const discussionPrompts = [
        `سؤال مثير للتفكير ${titleContext}: **لماذا** تعتقد أن هذا المبدأ مهم؟ ما الفرق الذي سيحدثه لو لم يوجد؟`,
        `فكرة ممتعة ${titleContext}! لنذهب أعمق — **ما الاستثناء الوحيد** الذي تعتقد أنه قد لا ينطبق عليه هذا المفهوم؟`,
        `أعجبني تفكيرك ${titleContext}. **قارن** ما فهمته الآن بما كنت تعرفه قبل مشاهدة الدرس. ما الذي تغيّر؟`,
        `سؤال سقراطي ${titleContext}: إذا أردت أن تشرح هذا المفهوم لشخص لا يعرف شيئاً عنه، **من أين ستبدأ؟**`,
      ];
      const idx = Math.floor(Date.now() / 10000) % discussionPrompts.length;
      return { reply: discussionPrompts[idx], understood: false };
    }
    return {
      reply: `ممتاز! 🌟 لقد أثبتت فهمك تماماً ${titleContext}. يمكنك متابعة الفيديو.`,
      understood: true,
    };
  } else {
    if (isConfused) {
      return {
        reply: `That's okay — confusion is the beginning of understanding!\n\nLet me ask something simpler ${titleContext}: **What is the one thing** you noticed or remembered from this section, even if incomplete?`,
        understood: false,
      };
    }
    if (isTooShort && isCheckpoint) {
      return {
        reply: `Good start! Let's go deeper ${titleContext}.\n\n**Can you explain** how this idea connects to what you learned earlier in the video?`,
        understood: false,
      };
    }
    if (claimsUnderstood && !hasSubstantialAnswer && isCheckpoint) {
      return {
        reply: `Great that you feel confident ${titleContext}! To confirm your understanding, **rephrase the main idea in your own words** without looking at the video.`,
        understood: false,
      };
    }
    if (hasSubstantialAnswer && isCheckpoint) {
      const turns = history.filter(h => h.role === "user").length;
      if (turns >= 2) {
        return {
          reply: `Excellent! 🌟 You've demonstrated deep understanding ${titleContext}. Keep up this level of critical thinking!`,
          understood: true,
        };
      }
      return {
        reply: `Great analysis ${titleContext}! One last question: **How would you apply this concept** in a real-world situation?`,
        understood: false,
      };
    }
    if (!isCheckpoint) {
      const discussionPrompts = [
        `Thought-provoking question ${titleContext}: **Why** do you think this principle matters? What would change if it didn't exist?`,
        `Interesting thought ${titleContext}! Let's go deeper — **what is one exception** where this concept might not apply?`,
        `I like your thinking ${titleContext}. **Compare** what you understand now to what you knew before watching. What changed?`,
        `Socratic question ${titleContext}: If you had to explain this to someone who knew nothing about it, **where would you start?**`,
      ];
      const idx = Math.floor(Date.now() / 10000) % discussionPrompts.length;
      return { reply: discussionPrompts[idx], understood: false };
    }
    return {
      reply: `Excellent! 🌟 You've fully demonstrated your understanding ${titleContext}. You're ready to continue!`,
      understood: true,
    };
  }
}

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const { message, history = [], checkpointId } = parsed.data;
    // videoTitle comes through req.body directly (extra field not in Zod schema — safe to read)
    const videoTitle: string | undefined = req.body?.videoTitle;
    const isCheckpoint = !!checkpointId;

    const userLang = (message.match(/[\u0600-\u06FF]/) ? "ar" : "en") as "ar" | "en";

    const { reply, understood } = buildSocraticReply(
      message,
      history as HistoryItem[],
      isCheckpoint,
      userLang,
      videoTitle
    );

    return res.json({ reply, understood });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
