import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { GenerateCareerRoadmapBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/career/roadmap", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = GenerateCareerRoadmapBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const userId = req.userId!;
    const isAdmin = req.userRole === "admin";

    // Fetch the user to check subscription and trial status
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(401).json({ error: "User not found" });

    const isSubscribed = user.subscribed || isAdmin;

    // Non-subscribers who have already used their trial are blocked
    if (!isSubscribed && user.simulatorTrialUsed) {
      return res.status(403).json({ error: "trial_used" });
    }

    const { interests, currentGrade, goals } = parsed.data;
    const goalsText = goals || "";

    type CareerData = {
      careers: string[];
      subjects: string[];
      title: string;
      visionTitle: string;
      salary5yr: string;
      jobTitle5yr: string;
    };

    const interestMap: Record<string, CareerData> = {
      رياضيات: { careers: ["عالم بيانات", "محلل مالي", "مهندس برمجيات", "خبير إحصاء"], subjects: ["التفاضل والتكامل", "الإحصاء", "الجبر الخطي", "علم الحاسوب"], title: "الرياضيات والتحليل", visionTitle: "مسارك نحو السيادة العلمية", salary5yr: "$5,000 - $7,500/month", jobTitle5yr: "محلل بيانات أو مهندس أول" },
      علوم: { careers: ["باحث علمي", "مهندس أحياء دقيقة", "صيدلاني", "عالم بيئة"], subjects: ["الأحياء", "الكيمياء", "الفيزياء", "المنهجية العلمية"], title: "العلوم والبحث", visionTitle: "مسارك نحو اكتشافات تُغير العالم", salary5yr: "$4,000 - $6,500/month", jobTitle5yr: "باحث أول أو متخصص علوم" },
      تكنولوجيا: { careers: ["مهندس برمجيات", "مهندس ذكاء اصطناعي", "محلل أمن سيبراني", "مدير منتج"], subjects: ["علم الحاسوب", "هياكل البيانات", "الخوارزميات", "تصميم الأنظمة"], title: "التكنولوجيا والهندسة", visionTitle: "مسارك نحو قيادة الثورة الرقمية", salary5yr: "$6,000 - $11,000/month", jobTitle5yr: "مهندس برمجيات أول أو رئيس تقنية" },
      ذكاء: { careers: ["مهندس ذكاء اصطناعي", "عالم تعلم آلي", "باحث NLP", "مهندس بيانات"], subjects: ["الخوارزميات", "الإحصاء", "Python", "الشبكات العصبية"], title: "الذكاء الاصطناعي", visionTitle: "مسارك نحو صناعة المستقبل بيديك", salary5yr: "$8,000 - $14,000/month", jobTitle5yr: "مهندس ذكاء اصطناعي أول" },
      أعمال: { careers: ["رائد أعمال", "مدير تسويق", "مستشار مالي", "مدير استراتيجية"], subjects: ["الاقتصاد", "المحاسبة", "استراتيجية الأعمال", "التسويق"], title: "الأعمال وريادة الأعمال", visionTitle: "مسارك نحو السيادة المادية", salary5yr: "$5,500 - $12,000/month", jobTitle5yr: "مدير تنفيذي أو رائد أعمال ناجح" },
      طب: { careers: ["طبيب", "ممرض متخصص", "باحث طبي", "مدير رعاية صحية"], subjects: ["الأحياء", "الكيمياء", "علم التشريح", "أخلاقيات الطب"], title: "الطب والرعاية الصحية", visionTitle: "مسارك نحو إنقاذ الأرواح وصنع الفارق", salary5yr: "$7,000 - $14,000/month", jobTitle5yr: "طبيب مقيم متخصص" },
      تصميم: { careers: ["مصمم UX/UI", "مصمم جرافيك", "مهندس معماري", "مخرج إبداعي"], subjects: ["مبادئ التصميم", "الوسائط الرقمية", "نظرية الألوان", "Adobe Suite"], title: "التصميم والفنون الإبداعية", visionTitle: "مسارك نحو تشكيل الجماليات التي يراها العالم", salary5yr: "$3,200 - $7,000/month", jobTitle5yr: "مصمم أول أو مدير إبداعي" },
      قانون: { careers: ["محامي", "قاضي", "مستشار قانوني", "دبلوماسي"], subjects: ["الفقه القانوني", "القانون المدني", "الإجراءات الجنائية", "حقوق الإنسان"], title: "القانون والعدالة", visionTitle: "مسارك نحو حماية الحق والعدل", salary5yr: "$5,000 - $9,500/month", jobTitle5yr: "محامي متخصص أو مستشار قانوني" },
    };

    const primaryInterest = interests[0] || "تكنولوجيا";
    const matchedKey = Object.keys(interestMap).find(k =>
      primaryInterest.toLowerCase().includes(k) || k.includes(primaryInterest.toLowerCase())
    ) || "تكنولوجيا";
    const matched: CareerData = interestMap[matchedKey] || interestMap["تكنولوجيا"];

    const gradeText = currentGrade || "ثانوي";

    const roadmap = {
      title: matched.visionTitle,
      summary: `بناءً على اهتمامك بـ ${interests.join("، ")}، صمّم نُور AI خارطة طريق مخصصة لتحقيق هدفك${goalsText ? `: "${goalsText}"` : ""}. هذا المسار سيأخذك من حيث أنت الآن إلى مكانة مهنية متميزة في مجال ${matched.title}.`,
      estimatedYears: 5,
      topCareers: matched.careers,
      recommendedSubjects: matched.subjects,
      financialProjection: {
        estimatedSalary: matched.salary5yr,
        jobTitle: matched.jobTitle5yr,
        currency: "USD",
        timeframe: "خلال 5 سنوات",
      },
      steps: [
        {
          phase: 1,
          title: "بناء الأساس المتين",
          description: `تعزيز قاعدتك الأكاديمية في مرحلة ${gradeText} والتعمق في مجال ${matched.title}، مع بناء عادات التعلم الذاتي.`,
          duration: "السنة الأولى",
          milestones: [
            `التفوق في مادتَي ${matched.subjects[0]} و${matched.subjects[1]}`,
            "الانضمام إلى مجموعات دراسية وأندية علمية",
            "إطلاق أول مشروع شخصي أو محفظة أعمال",
            "الحصول على شهادة تمهيدية في المجال",
          ],
        },
        {
          phase: 2,
          title: "التعليم المتخصص والخبرة",
          description: `الالتحاق ببرنامج أكاديمي متخصص في ${matched.title}، مع اكتساب الخبرة العملية من خلال التدريب والمشاريع الميدانية.`,
          duration: "السنتان الثانية والثالثة",
          milestones: [
            `الالتحاق ببرنامج ${matched.title} في جامعة مرموقة`,
            "إتمام تدريبين مهنيين في شركات رائدة",
            "بناء شبكة علاقات مهنية قوية",
            "نشر أو المشاركة في مشاريع بحثية أو تجارية",
          ],
        },
        {
          phase: 3,
          title: "الانطلاق المهني",
          description: `الدخول إلى سوق العمل بثقة عالية، مع استمرار تطوير المهارات والتخصص في أدق تفاصيل ${matched.title}.`,
          duration: "السنة الرابعة",
          milestones: [
            `الحصول على أول وظيفة كـ${matched.careers[0]}`,
            "اكتساب شهادات احترافية معتمدة دولياً",
            "بناء سمعة مهنية قوية في مجالك",
            "قيادة مشاريع صغيرة بشكل مستقل",
          ],
        },
        {
          phase: 4,
          title: "الريادة والسيادة",
          description: "الترقي إلى مناصب قيادية أو تأسيس مشروعك الخاص، وترك بصمة حقيقية في مجالك والمجتمع.",
          duration: "السنة الخامسة وما بعدها",
          milestones: [
            `الوصول إلى مستوى ${matched.jobTitle5yr}`,
            `دخل متوقع: ${matched.salary5yr}`,
            "تأثير حقيقي في المجال والمجتمع",
            "تمكين الجيل القادم من المتعلمين",
          ],
        },
      ],
    };

    // Mark trial as used for non-subscribers after successful generation
    if (!isSubscribed) {
      await db.update(usersTable)
        .set({ simulatorTrialUsed: true })
        .where(eq(usersTable.id, userId));
    }

    return res.json(roadmap);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
