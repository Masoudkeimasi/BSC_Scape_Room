import supplied from "./supplied.json" with { type: "json" };
import { contentSchema } from "../lib/content-validation";
import { Content, components, perspectives, Theory } from "../lib/types";
// Supplied 128-option matrix; theory additions, vision and causal annotations remain teaching interpretations.
export const demo: Content = {
  label: "DEMONSTRATION • provisional chains and synthetic teaching data",
  approved: false,
  options: supplied.options as Content["options"],
  chains: perspectives.flatMap((p) =>
    [1, 2, 3].map((i) => ({
      id: `${p}${i}`,
      perspective: p,
      options: components.map((c) => `${p}-${c}${i}`),
    })),
  ),
  calculations: contentSchema.shape.calculations.parse(supplied.calculations),
  vision: [
    {
      id: "v1",
      text: "Create trusted food through responsible growth and consumer insight.",
      correct: true,
    },
    {
      id: "v2",
      text: "Combine financial resilience with safe, sustainable operations.",
      correct: true,
    },
    {
      id: "v3",
      text: "Build ethical, digitally capable teams that keep learning.",
      correct: true,
    },
    ...[
      "Maximise profits regardless of safety.",
      "Treat consumer trust as irrelevant.",
      "Replace evidence with intuition.",
      "Increase emissions to signal success.",
      "Reward concealment of ethical concerns.",
      "Stop investing in employee capability.",
    ].map((text, i) => ({ id: `v${i + 4}`, text, correct: false })),
  ],
  causalLinks: supplied.causalLinks,
  review: supplied.review,
  theory: [],
};
const mcqs: [string, string, string[], string][] = [
  [
    "What is the principal purpose of a Balanced Scorecard?",
    "Translate strategy into linked objectives and measures",
    [
      "Replace strategy with accounting",
      "Maximise the number of KPIs",
      "Measure only annual profit",
    ],
    "It translates strategy into an aligned performance system.",
  ],
  [
    "Which is a standard Balanced Scorecard perspective?",
    "Learning and Growth",
    ["Advertising", "Taxation", "Procurement"],
    "The four perspectives include Learning and Growth.",
  ],
  [
    "What does a Strategy Map primarily describe?",
    "Hypothesised causal relationships between objectives",
    [
      "An organisation chart",
      "A list of budgets",
      "A proven law of profitability",
    ],
    "Strategic causal links are hypotheses to test.",
  ],
  [
    "Which is normally a lagging indicator?",
    "Last year’s operating profit",
    [
      "Training capability",
      "Maintenance readiness",
      "Current skill acquisition",
    ],
    "Profit reports an achieved outcome.",
  ],
  [
    "Which statement is a strategic objective?",
    "Strengthen consumer trust",
    ["Trust index", "Eight percentage points", "Run a listening workshop"],
    "An objective states a desired strategic outcome.",
  ],
  [
    "Which item is a measure?",
    "Return on Assets (%)",
    [
      "Improve asset profitability",
      "At least 10% by 2028",
      "Review underperforming assets",
    ],
    "A measure operationalises an objective.",
  ],
  [
    "Which item is a target?",
    "85% certified by 2028",
    [
      "Certification rate",
      "Strengthen digital skills",
      "Deliver assessed learning",
    ],
    "Targets specify desired performance and timing.",
  ],
  [
    "Which item is an initiative?",
    "Launch role-based learning pathways",
    ["85%", "Certification rate", "Build capabilities"],
    "Initiatives are actions or programmes.",
  ],
  [
    "Why combine financial and non-financial measures?",
    "Connect outcomes with their strategic drivers",
    [
      "Make reports longer",
      "Avoid financial accountability",
      "Guarantee causality",
    ],
    "Both results and drivers are needed.",
  ],
  [
    "What is an intangible asset in this framework?",
    "Employee capability",
    ["Inventory", "Factory equipment", "Cash reserves"],
    "Capabilities are intangible strategic resources.",
  ],
  [
    "What is KPI gaming?",
    "Improving reported metrics while undermining the intended outcome",
    ["Using a dashboard", "Auditing data", "Reviewing baselines"],
    "Metrics can create incentives with unintended effects.",
  ],
  [
    "Which target improves a 12% market share baseline?",
    "13.5% by 2028",
    ["10% by 2028", "12% indefinitely", "An undefined increase"],
    "A 1.5 percentage-point increase gives 13.5%.",
  ],
  [
    "Why use average assets in the specified ROA formula?",
    "To relate period profit to assets employed during the period",
    [
      "To inflate profit",
      "To ignore opening balances",
      "To calculate sales growth",
    ],
    "Opening and closing balances approximate period resources.",
  ],
  [
    "What does strategic alignment require?",
    "Coherence across objectives, measures, targets and initiatives",
    [
      "Identical measures everywhere",
      "Financial-only rewards",
      "Unrelated departmental goals",
    ],
    "Alignment concerns coherent strategic relationships.",
  ],
  [
    "Which is a useful limitation to acknowledge?",
    "A causal arrow does not prove causality",
    [
      "All KPIs are objective truths",
      "Targets cannot change behaviour",
      "Financial results never matter",
    ],
    "Evidence must test the hypothesised relationships.",
  ],
];
const bools: [string, boolean, string][] = [
  [
    "The Balanced Scorecard includes only financial indicators.",
    false,
    "It includes four perspectives.",
  ],
  [
    "An initiative and a performance measure are the same thing.",
    false,
    "Actions and measurement have distinct roles.",
  ],
  [
    "A lower emissions target can represent improvement.",
    true,
    "For emissions, lower is typically better within a consistent boundary.",
  ],
  [
    "Correlation alone proves a Strategy Map causal link.",
    false,
    "Confounding and reverse causality remain possible.",
  ],
  [
    "A measure can belong to the correct perspective but the wrong chain.",
    true,
    "It must also align with the selected objective.",
  ],
  [
    "Targets should account for a relevant baseline.",
    true,
    "The baseline determines direction and magnitude.",
  ],
  [
    "Learning and Growth can support process improvement.",
    true,
    "Capabilities can enable improved execution.",
  ],
  [
    "More training hours necessarily demonstrate greater capability.",
    false,
    "Assessed learning outcomes are stronger evidence.",
  ],
  [
    "Local optimisation can undermine organisation-wide strategy.",
    true,
    "A local metric may create harmful system effects.",
  ],
  [
    "Strategy execution requires reviewing assumptions and results.",
    true,
    "Feedback supports strategic learning.",
  ],
];
const blanks: [string, string[], string][] = [
  [
    "The four perspectives are Financial, Customer, Internal Process and Learning and ____.",
    ["growth"],
    "Learning and Growth underpins capability development.",
  ],
  [
    "A desired numerical performance level with a deadline is a ____.",
    ["target"],
    "A target specifies desired performance.",
  ],
  [
    "An action programme designed to deliver an objective is an ____.",
    ["initiative", "strategic initiative"],
    "Initiatives put strategy into action.",
  ],
  [
    "Indicators describing achieved outcomes are called ____ indicators.",
    ["lagging"],
    "Lagging indicators report results.",
  ],
  [
    "Indicators of future performance drivers are called ____ indicators.",
    ["leading"],
    "Leading indicators describe drivers.",
  ],
];
demo.theory = [
  ...mcqs.map(([prompt, answer, other, explanation], i): Theory => ({
    id: `q${i + 1}`,
    type: "mcq",
    prompt,
    choices: [answer, ...other],
    answers: [answer],
    explanation,
  })),
  ...bools.map(([prompt, answer, explanation], i): Theory => ({
    id: `q${i + 16}`,
    type: "boolean",
    prompt,
    choices: ["True", "False"],
    answers: [answer ? "True" : "False"],
    explanation,
  })),
  ...blanks.map(([prompt, answers, explanation], i): Theory => ({
    id: `q${i + 26}`,
    type: "blank",
    prompt,
    choices: [],
    answers,
    explanation,
  })),
];
