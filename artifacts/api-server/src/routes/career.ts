import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { GenerateCareerRoadmapBody } from "@workspace/api-zod";

const router = Router();

router.post("/career/roadmap", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = GenerateCareerRoadmapBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    
    const { interests, currentGrade, goals } = parsed.data;
    
    const interestMap: Record<string, { careers: string[]; subjects: string[]; title: string }> = {
      math: { careers: ["Data Scientist", "Actuary", "Financial Analyst", "Software Engineer"], subjects: ["Calculus", "Statistics", "Linear Algebra", "Computer Science"], title: "Mathematics & Analytics" },
      science: { careers: ["Research Scientist", "Biomedical Engineer", "Pharmacist", "Environmental Scientist"], subjects: ["Biology", "Chemistry", "Physics", "Research Methods"], title: "Science & Research" },
      technology: { careers: ["Software Engineer", "AI Engineer", "Cybersecurity Analyst", "Product Manager"], subjects: ["Computer Science", "Data Structures", "Algorithms", "System Design"], title: "Technology & Engineering" },
      art: { careers: ["UI/UX Designer", "Architect", "Graphic Designer", "Creative Director"], subjects: ["Design Principles", "Digital Media", "Art History", "Color Theory"], title: "Creative Arts & Design" },
      business: { careers: ["Entrepreneur", "Marketing Manager", "Financial Advisor", "Consultant"], subjects: ["Economics", "Accounting", "Business Strategy", "Marketing"], title: "Business & Entrepreneurship" },
      medicine: { careers: ["Doctor", "Nurse", "Medical Researcher", "Healthcare Administrator"], subjects: ["Biology", "Chemistry", "Anatomy", "Medical Ethics"], title: "Medicine & Healthcare" },
    };
    
    const primaryInterest = interests[0]?.toLowerCase() || "technology";
    const matched = interestMap[primaryInterest] || interestMap.technology;
    
    const gradeNum = parseInt(currentGrade.replace(/\D/g, "")) || 10;
    const yearsToGrad = Math.max(0, 12 - gradeNum);
    const totalYears = yearsToGrad + 4;
    
    const roadmap = {
      title: `Your ${matched.title} Career Roadmap`,
      summary: `Based on your interest in ${interests.join(", ")}, NOOR AI has crafted a personalized career path to help you reach your goals${goals ? `: ${goals}` : ""}. This roadmap spans ${totalYears} years of guided learning and growth.`,
      estimatedYears: totalYears,
      topCareers: matched.careers,
      recommendedSubjects: matched.subjects,
      steps: [
        {
          phase: 1,
          title: "Foundation Building",
          description: "Strengthen your academic foundation and explore your core interests through focused study.",
          duration: `${yearsToGrad} year${yearsToGrad !== 1 ? "s" : ""}`,
          milestones: [
            `Excel in ${matched.subjects[0]} and ${matched.subjects[1]}`,
            "Join relevant school clubs or extracurriculars",
            "Start a personal project or portfolio",
            "Score high on standardized tests",
          ],
        },
        {
          phase: 2,
          title: "Higher Education",
          description: "Pursue a degree aligned with your career goals, building deep expertise and professional networks.",
          duration: "4 years",
          milestones: [
            `Enroll in a ${matched.title} program`,
            "Complete 2 internships in your field",
            "Build a professional GitHub/portfolio",
            "Network with industry professionals",
          ],
        },
        {
          phase: 3,
          title: "Early Career",
          description: "Launch your professional journey with entry-level roles that build real-world experience.",
          duration: "2-3 years",
          milestones: [
            `Land your first role as ${matched.careers[0]}`,
            "Obtain relevant certifications",
            "Build a professional reputation",
            "Mentor junior students",
          ],
        },
        {
          phase: 4,
          title: "Career Mastery",
          description: "Advance to senior roles, lead teams, and make significant impact in your field.",
          duration: "Ongoing",
          milestones: [
            "Senior-level position or entrepreneurship",
            "Industry thought leadership",
            "Mentoring and giving back",
            "Continuous learning and adaptation",
          ],
        },
      ],
    };
    
    return res.json(roadmap);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
