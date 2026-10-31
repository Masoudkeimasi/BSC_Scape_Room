import {
  Content,
  Perspective,
  components,
  perspectives,
  Theory,
} from "../lib/types";
// Teaching fixture only. The approved case and 96 approved distractors have not been supplied.
const texts: Record<Perspective, string[][]> = {
  F: [
    [
      "Improve asset profitability.",
      "Return on Assets (%).",
      "Increase ROA to at least 10% by 2028.",
      "Improve asset utilisation, review underperforming assets and strengthen capital allocation.",
    ],
    [
      "Improve operating profitability through sustainable productivity gains.",
      "Operating profit margin (%).",
      "At least 17% by 2028.",
      "Responsible productivity improvements, waste reduction and cost transformation.",
    ],
    [
      "Strengthen free cash flow and financial resilience.",
      "Free cash flow (£ million).",
      "Above £1.7 billion by 2028.",
      "Inventory, receivables and capital-expenditure cash conversion improvements.",
    ],
  ],
  C: [
    [
      "Increase market share in priority categories.",
      "Market share (%).",
      "Increase by 1.5 percentage points by 2028.",
      "Evidence-based category growth plans.",
    ],
    [
      "Strengthen consumer trust and brand preference.",
      "Consumer trust and brand preference index.",
      "Improve by 8 percentage points by 2028.",
      "Transparent product communication, consumer listening and quality assurance.",
    ],
    [
      "Improve product accessibility.",
      "Weighted product distribution (%).",
      "At least 95% by 2028.",
      "Omnichannel distribution partnerships.",
    ],
  ],
  P: [
    [
      "Improve manufacturing productivity while maintaining safety and quality.",
      "Manufacturing conversion cost per saleable unit.",
      "Reduce by 8% by 2028 while maintaining required quality compliance.",
      "Automation, predictive maintenance and waste reduction.",
    ],
    [
      "Accelerate responsible product innovation.",
      "Average concept-to-launch time.",
      "Reduce by 20% by 2028 without compromising safety.",
      "Cross-functional innovation teams, digital development and safety gates.",
    ],
    [
      "Reduce operational greenhouse-gas emissions.",
      "Scope 1 and 2 emissions in tonnes CO₂e.",
      "Reduce by 45% from 2022 to at most 275,000 tonnes CO₂e by 2030.",
      "Energy efficiency, low-carbon heat and verified emissions monitoring.",
    ],
  ],
  L: [
    [
      "Strengthen digital, data and responsible AI capabilities.",
      "Percentage of relevant employees certified.",
      "85% by 2028.",
      "Role-based learning pathways and competency assessment.",
    ],
    [
      "Strengthen consumer insight and cross-functional innovation capabilities.",
      "Percentage completing assessed programmes.",
      "90% by 2028.",
      "Innovation academies, consumer insight workshops and knowledge sharing.",
    ],
    [
      "Build an accountable, ethical and sustainability-oriented culture.",
      "Percentage of employees with integrated performance goals.",
      "100% by 2028.",
      "Ethics, sustainability and accountability in performance management and leadership development.",
    ],
  ],
};
const distractors: Record<Perspective, string[][]> = {
  F: [
    [
      "Maximise this quarter’s profit regardless of food safety.",
      "Increase social followers as the primary financial objective.",
      "Expand assets without assessing returns.",
      "Improve profit by delaying all supplier payments indefinitely.",
      "Eliminate all investment to maximise current cash.",
      "Make every financial ratio increase regardless of its meaning.",
    ],
    [
      "Net profit divided by closing liabilities (%).",
      "Total social media impressions.",
      "Revenue with no cost or asset context.",
      "Cash collected excluding overdue accounts.",
      "Number of machines purchased.",
      "Operating profit divided by net profit (%).",
    ],
    [
      "Reduce ROA to 6% by 2028.",
      "Improve profitability soon.",
      "Reach 170% operating margin by next month.",
      "Generate £1.7 million cash by 2028.",
      "Increase ROA by 10 with no unit or baseline.",
      "Increase cash by selling all productive assets this year.",
    ],
    [
      "Cut mandatory safety inspections.",
      "Purchase assets solely to enlarge the balance sheet.",
      "Delay recording expenses until next year.",
      "Launch an employee sports club to fix asset returns.",
      "Stop collecting receivables.",
      "Discontinue all maintenance permanently.",
    ],
  ],
  C: [
    [
      "Grow category share by misleading consumers.",
      "Maximise factory utilisation as the customer outcome.",
      "Sell only to existing premium customers and call it accessibility.",
      "Increase complaints to prove engagement.",
      "Prioritise shipment volume over availability.",
      "Ignore consumers in low-income regions.",
    ],
    [
      "Company sales divided by its own sales (%).",
      "Total unverified page views.",
      "Factory downtime hours.",
      "Trust survey of loyal customers only.",
      "Number of internal sales meetings.",
      "Distribution outlets counted without sales weights.",
    ],
    [
      "Reduce market share to 10% by 2028.",
      "Improve trust eventually.",
      "Reach 105% weighted distribution.",
      "Improve trust by 8% with no index definition.",
      "Reach every consumer tomorrow with no resources.",
      "Increase shipments regardless of consumer access.",
    ],
    [
      "Hide ingredient information.",
      "End all retailer partnerships.",
      "Buy followers to improve consumer trust.",
      "Measure trust only among employees.",
      "Reduce product quality to extend distribution.",
      "Replace category research with executive guesses.",
    ],
  ],
  P: [
    [
      "Reduce costs by abandoning food safety.",
      "Maximise local throughput regardless of waste downstream.",
      "Increase emissions to demonstrate growth.",
      "Launch every idea without testing.",
      "Improve brand preference as a factory output.",
      "Remove quality accountability.",
    ],
    [
      "Cost divided by defective units only.",
      "Number of ideas submitted without launch outcomes.",
      "Scope 3 emissions labelled Scope 1 and 2.",
      "Production volume including unsaleable waste.",
      "Number of maintenance emails.",
      "Time to launch excluding all delayed projects.",
    ],
    [
      "Increase emissions to 600,000 tonnes by 2030.",
      "Reduce costs at some point.",
      "Launch products instantly with no safety testing.",
      "Reduce emissions by 45 tonnes instead of 45%.",
      "Reduce lead time by 200%.",
      "Cut unit costs without a baseline or quality condition.",
    ],
    [
      "Cancel predictive maintenance.",
      "Bypass safety gates to accelerate launches.",
      "Transfer emissions off the books.",
      "Automate without feasibility or training.",
      "Increase finished inventory regardless of demand.",
      "Reward factory managers solely for output.",
    ],
  ],
  L: [
    [
      "Certify staff without assessing capability.",
      "Increase short-term share price as a learning objective.",
      "Build an ethical culture by concealing breaches.",
      "Eliminate cross-functional collaboration.",
      "Maximise attendance instead of learning outcomes.",
      "Reward only individual competition.",
    ],
    [
      "Training hours with no assessment.",
      "Certified staff divided by all customers.",
      "Number of AI tools purchased.",
      "Course satisfaction from completers only.",
      "Share price at closing.",
      "Number of ethics posters printed.",
    ],
    [
      "Reduce certification to 40% by 2028.",
      "Learn more soon.",
      "Certify 150% of relevant employees.",
      "Achieve 90 completions without defining population.",
      "Set integrated goals for selected executives only.",
      "Achieve capability with no budget or time.",
    ],
    [
      "Issue certificates automatically to all attendees.",
      "Replace consumer insight with intuition.",
      "Reward staff for hiding ethics issues.",
      "Buy software instead of assessing capability.",
      "Cancel all knowledge-sharing sessions.",
      "Set financial-only performance goals.",
    ],
  ],
};
const categories = [
  ["D5", "D6", "D3", "D15", "D8", "D1"],
  ["D11", "D19", "D6", "D21", "D18", "D22"],
  ["D25", "D2", "D10", "D22", "D13", "D16"],
  ["D5", "D23", "D12", "D16", "D24", "D4"],
];
export const demo: Content = {
  label: "DEMONSTRATION • provisional chains and synthetic teaching data",
  approved: false,
  options: perspectives.flatMap((p) =>
    components.flatMap((c, ci) =>
      Array.from({ length: 9 }, (_, i) => ({
        id: `${p}-${c}${i + 1}`,
        perspective: p,
        component: c,
        text: i < 3 ? texts[p][i][ci] : distractors[p][ci][i - 3],
        correct: i < 3,
        chainId: i < 3 ? `${p}${i + 1}` : null,
        primaryCategory: i < 3 ? null : categories[ci][(i - 3) % 6],
        secondaryCategories: [],
        explanation:
          i < 3
            ? "Provisional chain alignment supplied in the teaching brief."
            : `This option introduces ${categories[ci][(i - 3) % 6]}: evaluate its definition, strategic alignment, feasibility and evidence.`,
        feedback:
          i < 3
            ? "Consider the entire chain."
            : "Check strategic alignment, denominator, baseline, direction and ethical constraints.",
        evidence: "Teaching assumption — not an approved annual review.",
        ...(c === "T" && ((p === "P" && i === 2) || (p !== "P" && i === 0))
          ? { calculationId: `${p}-baseline` }
          : {}),
      })),
    ),
  ),
  chains: perspectives.flatMap((p) =>
    [1, 2, 3].map((i) => ({
      id: `${p}${i}`,
      perspective: p,
      options: components.map((c) => `${p}-${c}${i}`),
    })),
  ),
  calculations: [
    {
      id: "F-baseline",
      chainId: "F1",
      title: "Return on assets",
      formula: "Net profit ÷ ((opening assets + closing assets) ÷ 2) × 100",
      inputs: {
        "Net profit (£m)": 240,
        "Opening assets (£m)": 2800,
        "Closing assets (£m)": 3200,
      },
      expected: 8,
      tolerance: 0.01,
      unit: "%",
    },
    {
      id: "C-baseline",
      chainId: "C1",
      title: "Market share",
      formula: "Company category sales ÷ total category market sales × 100",
      inputs: {
        "Company category sales (£m)": 600,
        "Category market sales (£m)": 5000,
      },
      expected: 12,
      tolerance: 0.01,
      unit: "%",
    },
    {
      id: "P-baseline",
      chainId: "P3",
      title: "Emissions end value",
      formula: "2022 baseline × (1 − reduction proportion)",
      inputs: {
        "2022 emissions (tonnes CO₂e)": 500000,
        "Reduction proportion": 0.45,
      },
      expected: 275000,
      tolerance: 1,
      unit: "tonnes CO₂e",
    },
    {
      id: "L-baseline",
      chainId: "L1",
      title: "Certification baseline",
      formula: "Certified employees ÷ relevant employees × 100",
      inputs: { "Certified employees": 300, "Relevant employees": 600 },
      expected: 50,
      tolerance: 0.01,
      unit: "%",
    },
  ],
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
  causalLinks: [
    "L1>P1",
    "L1>P2",
    "L2>P2",
    "L3>P3",
    "L3>P1",
    "P1>C3",
    "P2>C1",
    "P2>C2",
    "P3>C2",
    "C1>F1",
    "C1>F2",
    "C2>F2",
    "C3>F3",
    "C3>F1",
  ],
  review: [
    {
      title: "01 / Import placeholder & case status",
      body: "No instructor-approved annual review has been supplied. All figures, vision statements and causal links in this demo are teaching assumptions. Import the approved case through the protected instructor workspace before using it for assessment.",
    },
    {
      title: "02 / Purpose, vision & values",
      body: "Teaching vision: create trusted food through responsible growth and consumer insight. Values: food safety, transparency, ethical accountability, inclusion and learning. Priorities: financial resilience, responsible productivity, customer accessibility, innovation and sustainability.",
    },
    {
      title: "03 / Illustrative financial statements",
      body: "Synthetic teaching figures, £ million. These do not represent official company results. Assets are opening and closing balances; average assets are 3,000.",
      table: [
        ["Item", "Opening / prior", "Closing / current"],
        ["Total assets", "2,800", "3,200"],
        ["Net profit", "—", "240"],
        ["Revenue", "—", "10,000"],
        ["Operating profit", "—", "1,500"],
        ["Operating cash flow", "—", "2,000"],
        ["Capital expenditure", "—", "500"],
      ],
    },
    {
      title: "04 / Consumers & distribution",
      body: "Illustrative category sales £600m; total category sales £5,000m. Market share uses category sales, not total group revenue. A 1.5 percentage-point improvement from 12% means 13.5%, not 12.18%. Trust and weighted distribution need consistently defined surveys and weights.",
    },
    {
      title: "05 / Sustainability & operations",
      body: "Illustrative 2022 Scope 1 and 2 baseline: 500,000 tonnes CO₂e. A 45% reduction implies at most 275,000 tonnes by 2030. Productivity and innovation targets retain safety and quality constraints. Scope boundaries and comparable periods matter.",
    },
    {
      title: "06 / People & KPI glossary",
      body: "Illustrative certification: 300 of 600 relevant employees. ROA = net profit / average assets × 100. Operating margin = operating profit / revenue × 100. Free cash flow = operating cash flow − capital expenditure. Weighted distribution weights outlets by category sales. Leading indicators describe capability or drivers; lagging indicators describe achieved outcomes.",
    },
  ],
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
