import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { content, identity, readProgress } from "@/lib/server";
export async function GET() {
  try {
    const i = await identity();
    const c = await content();
    const p = await readProgress(i, c);
    if (
      !p.finishedAt ||
      !p.completed.includes(6) ||
      !p.attempts.some(
        (a) => a.score >= Math.ceil(10 * (c.settings?.passThreshold ?? 0.75)),
      )
    )
      return NextResponse.json(
        {
          error: "Complete all six rooms and pass the final assessment first.",
        },
        { status: 403 },
      );
    const pdf = new jsPDF({ orientation: "landscape" });
    pdf.addFileToVFS(
      "DejaVuSans.ttf",
      (
        await readFile(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"))
      ).toString("base64"),
    );
    pdf.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    pdf.setFont("DejaVu");
    pdf.setFillColor(10, 24, 37);
    pdf.rect(0, 0, 297, 210, "F");
    pdf.setDrawColor(201, 166, 96);
    pdf.setLineWidth(1);
    pdf.rect(12, 12, 273, 186);
    pdf.setTextColor(201, 166, 96);
    pdf.setFontSize(15);
    pdf.text("PERSEPOLIS FOODS", 148, 35, { align: "center" });
    pdf.setFontSize(28);
    pdf.text("CERTIFICATE OF COMPLETION", 148, 58, { align: "center" });
    pdf.setTextColor(240, 245, 244);
    pdf.setFontSize(18);
    pdf.text("Strategy Map Escape Room", 148, 76, { align: "center" });
    pdf.setFontSize(24);
    pdf.text(p.name.slice(0, 65) || "Anonymous strategist", 148, 104, {
      align: "center",
    });
    pdf.setFontSize(13);
    pdf.text("Successfully completed all six rooms", 148, 124, {
      align: "center",
    });
    pdf.text(
      `Final assessment: ${p.attempts.at(-1)!.score}/10 | ${new Date(p.finishedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}`,
      148,
      137,
      { align: "center" },
    );
    pdf.text(`Certificate ID: ${p.certificateId}`, 148, 150, {
      align: "center",
    });
    pdf.setFontSize(10);
    pdf.text(
      "Educational game completion certificate. Not a professional qualification.",
      148,
      175,
      { align: "center" },
    );
    pdf.text(
      i.authenticated
        ? "Authenticated assessment"
        : "Anonymous demonstration - identity and progress are not verified.",
      148,
      183,
      { align: "center" },
    );
    return new NextResponse(pdf.output("arraybuffer"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="persepolis-certificate.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
