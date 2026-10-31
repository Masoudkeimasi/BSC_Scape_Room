import { readFileSync } from "node:fs";
import { demo } from "../src/data/demo";
import supplied from "../src/data/supplied.json";
import quiz from "../src/data/supplied-quiz.json";
import { validateContent } from "../src/lib/content-validation";
const raw = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf8"))
  : { ...demo, ...supplied, theory: [...quiz, ...demo.theory] };
const c = validateContent(raw);
console.log(
  `Validated ${c.options.length} options, ${c.chains.length} chains, ${c.theory.length} theory questions, ${c.calculations.length} calculations.`,
);
