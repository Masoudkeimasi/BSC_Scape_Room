import { NextRequest, NextResponse } from "next/server";
import { instructor } from "@/lib/server";
import { assertSameOrigin } from "@/lib/request-security";
import { shuffle } from "@/lib/game-engine";
import { isPuzzleOrder, isPuzzleSolved, PUZZLE_SIZE } from "@/lib/mission";
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!(await instructor()))
    return NextResponse.json(
      { error: "Instructor authorisation required." },
      { status: 403, headers },
    );
  try {
    assertSameOrigin(request.headers);
    const action = await request.json();
    if (action.type === "puzzle-start") {
      const order = shuffle(Array.from({ length: PUZZLE_SIZE }, (_, i) => i));
      if (isPuzzleSolved(order)) [order[0], order[1]] = [order[1], order[0]];
      return NextResponse.json(
        {
          order,
          message: "Preview puzzle shuffled. No student progress is affected.",
        },
        { headers },
      );
    }
    if (action.type !== "puzzle-submit" || !isPuzzleOrder(action.order))
      throw new Error("Submit all sixteen distinct puzzle pieces.");
    const correct = isPuzzleSolved(action.order);
    return NextResponse.json(
      {
        order: action.order,
        correct,
        message: correct
          ? "Preview complete. The picture is correct. No student vaults were unlocked."
          : "The picture is not complete yet. Try another arrangement.",
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400, headers },
    );
  }
}
