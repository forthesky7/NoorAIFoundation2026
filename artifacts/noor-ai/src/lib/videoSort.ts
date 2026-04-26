/**
 * NOOR AI — Stable Video Sort
 * Hierarchy: Category → Teacher/Subject Group → Episode Number
 *
 * Category order:
 *   Qudurat (القدرات) = 0
 *   Tahsili (التحصيلي) = 1
 *   Secondary (ثانوي) = 2
 *   General (عام) = 3
 *
 * Within each category, videos are partitioned into named groups.
 * Within each group, videos are sorted by episode number (حلقة N).
 * Stable-sort is preserved: videos that share group+episode keep their original
 * relative order (from insertion/admin order).
 */

// ─── Category ordering ────────────────────────────────────────────────────────
const CATEGORY_ORDER: Record<string, number> = {
  Qudurat: 0,
  Tahsili: 1,
  Secondary: 2,
  General: 3,
};

// ─── Episode extraction ───────────────────────────────────────────────────────
export function extractEpisode(title: string): number {
  // حلقة N (Arabic)
  const ar = title.match(/حلقة\s*(\d+)/);
  if (ar) return parseInt(ar[1], 10);
  // Episode N (English)
  const en = title.match(/[Ee]pisode\s*(\d+)/);
  if (en) return parseInt(en[1], 10);
  // Standalone number at start (e.g. "01 - مقدمة")
  const start = title.match(/^(\d+)\s*[-–.]/);
  if (start) return parseInt(start[1], 10);
  // مقدمة = intro = 0
  if (/مقدمة/.test(title)) return 0;
  return 9999;
}

// ─── Numeric prefix (01., 02., 00. …) ────────────────────────────────────────
function extractPrefix(title: string): number {
  const m = title.match(/^(\d{1,3})\./);
  return m ? parseInt(m[1], 10) : 999;
}

// ─── Group detection within category ─────────────────────────────────────────
function getGroupIndex(subject: string, title: string): number {
  if (subject === "Qudurat") {
    /**
     * قدرات — 7 ordered groups:
     * 0: أ. فهد التميمي [كمي]
     * 1: أ. فهد التميمي [استراتيجيات]
     * 2: دورات القدرات [كمي]   ← ep-6 "الأعداد الأولية" slots between 5 and 7 naturally
     * 3: أ. إيهاب عبد العظيم [لفظي]
     * 4: أ. إيهاب عبد العظيم [تدريب]
     * 5: أ. إيهاب عبد العظيم [نماذج]
     * 6: أ. إيهاب عبد العظيم [قطع]
     */
    const isFahad = /فهد|التميمي/.test(title);
    const isEhab  = /إيهاب|عبد.*العظيم|عبدالعظيم/.test(title);
    const isDawrat = /دورات.*قدرات|دورات القدرات/.test(title);

    if (isFahad) {
      if (/استراتيجيات/.test(title)) return 1;
      if (/كمي/.test(title))          return 0;
      return 0; // default فهد → كمي bucket
    }
    if (isDawrat) return 2;
    if (isEhab) {
      if (/لفظي/.test(title))  return 3;
      if (/تدريب/.test(title)) return 4;
      if (/نماذج/.test(title)) return 5;
      if (/قطع/.test(title))   return 6;
      return 3; // default إيهاب → لفظي bucket
    }
    // Unrecognised قدرات video — sort after all named groups, using prefix
    return 90 + extractPrefix(title);
  }

  if (subject === "Tahsili") {
    /**
     * تحصيلي — 4 ordered groups (غشام series):
     * 0: رياضيات
     * 1: فيزياء
     * 2: أحياء
     * 3: كيمياء
     * Fallback: by prefix then alphabetically
     */
    const isGhesham = /غشام/.test(title);
    if (isGhesham || true) {          // apply to all Tahsili unless we add more teachers
      if (/رياضيات/.test(title)) return 0;
      if (/فيزياء/.test(title))  return 1;
      if (/أحياء/.test(title))   return 2;
      if (/كيمياء/.test(title))  return 3;
    }
    // Unrecognised تحصيلي — by prefix
    return 90 + extractPrefix(title);
  }

  if (subject === "Secondary") {
    /**
     * ثانوي - مسارات:
     * Group by subject (via numeric prefix) and then by source series name.
     * e.g. prefix-01 = Math; within Math: "واضح" series before other series.
     * Keeps all "واضح" Math ep1-20 together, then next series.
     *
     * Encoding: prefix * 1000 + sourceOrder * 10
     *   sourceOrder: واضح=0, known series alphabetically, unknown=9
     */
    const prefix = extractPrefix(title);
    let sourceOrder: number;
    if (/واضح/.test(title))    sourceOrder = 0;
    else if (/مدرسة|school/i.test(title)) sourceOrder = 1;
    else                       sourceOrder = 9;
    return prefix * 1000 + sourceOrder * 10;
  }

  // General — no sub-grouping; pure episode order
  return 0;
}

// ─── Main sort function (stable) ──────────────────────────────────────────────
export function sortVideos<T extends { subject: string; title: string }>(
  videos: T[]
): T[] {
  // Add stable index before sorting
  const indexed = videos.map((v, i) => ({ v, i }));

  indexed.sort((a, b) => {
    // 1. Category
    const catA = CATEGORY_ORDER[a.v.subject] ?? 9;
    const catB = CATEGORY_ORDER[b.v.subject] ?? 9;
    if (catA !== catB) return catA - catB;

    // 2. Teacher / Subject Group
    const grpA = getGroupIndex(a.v.subject, a.v.title);
    const grpB = getGroupIndex(b.v.subject, b.v.title);
    if (grpA !== grpB) return grpA - grpB;

    // 3. Episode number within group
    const epA = extractEpisode(a.v.title);
    const epB = extractEpisode(b.v.title);
    if (epA !== epB) return epA - epB;

    // 4. Stable tie-break (preserves insertion order)
    return a.i - b.i;
  });

  return indexed.map(x => x.v);
}

// ─── Fuzzy multi-word search ───────────────────────────────────────────────────
export function fuzzyMatch(query: string, target: string): boolean {
  if (!query.trim()) return true;
  const words = query.trim().toLowerCase().split(/\s+/);
  const t = target.toLowerCase();
  return words.every(w => t.includes(w));
}
