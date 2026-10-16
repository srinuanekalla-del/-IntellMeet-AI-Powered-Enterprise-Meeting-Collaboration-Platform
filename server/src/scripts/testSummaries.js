// Week 3 checkpoint: measures summary / action-item accuracy on sample meetings.
// Run from the server folder:  node src/scripts/testSummaries.js
// (reads AI_PROVIDER and GROQ_API_KEY from server/.env)
import 'dotenv/config';
import { summarizeTranscript } from '../services/aiService.js';

// --- date helpers, so expected dates are always worked out from today ---
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
// next occurrence of a weekday AFTER today (0 = Sunday ... 6 = Saturday)
const nextWeekday = (wd) => {
  const d = new Date();
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== wd);
  return iso(d);
};

const SAMPLES = [
  {
    name: 'Launch planning',
    transcript:
      "Alice: Let's finalize the launch plan. Bob, can you prepare the demo by next Friday? Carol, please update the documentation before Monday. Bob: Sure. Alice: Also someone needs to fix the login bug before release.",
    expected: [
      { assignee: 'Bob', keyword: 'demo' },
      { assignee: 'Carol', keyword: 'documentation' },
      { assignee: 'Unassigned', keyword: 'login' },
    ],
  },
  {
    name: 'Budget review',
    transcript:
      "Dan: Q3 spend is 12 percent over. Erin, send me the vendor invoices by Wednesday. I'll draft the revised budget and share it tomorrow. Erin: Okay.",
    expected: [
      { assignee: 'Erin', keyword: 'invoice', due: nextWeekday(3) }, // Wednesday
      { assignee: 'Dan', keyword: 'budget', due: addDays(1) }, // tomorrow
    ],
  },
  {
    name: 'No actions (chitchat)',
    transcript: 'Sam: How was your weekend? Priya: Great, we went hiking. Sam: Nice, the weather was perfect.',
    expected: [],
  },
];

let hits = 0;
let total = 0;
let falsePositives = 0;

for (const s of SAMPLES) {
  const out = await summarizeTranscript(s.transcript);
  console.log(`\n=== ${s.name} ===\nSummary: ${out.summary}`);
  console.table(out.actionItems);

  for (const e of s.expected) {
    total++;
    const found = out.actionItems.find(
      (a) =>
        a.text.toLowerCase().includes(e.keyword) &&
        a.assignee.toLowerCase().includes(e.assignee.toLowerCase()) &&
        (!e.due || a.dueDate === e.due)
    );
    if (found) hits++;
    else console.log(`MISS: expected ${e.assignee} -> "${e.keyword}"${e.due ? ` due ${e.due}` : ''}`);
  }
  if (s.expected.length === 0) falsePositives += out.actionItems.length;
}

console.log(`\nAction items matched: ${hits}/${total}  |  false positives: ${falsePositives}`);
process.exit(hits === total && falsePositives === 0 ? 0 : 1);