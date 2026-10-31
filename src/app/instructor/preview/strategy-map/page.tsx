import { redirect } from "next/navigation";
import { instructor } from "@/lib/server";
import { InstructorPuzzlePreview } from "@/components/InstructorPuzzlePreview";
export const metadata = {
  title: "Instructor preview — Strategy Map Vault",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!(await instructor())) redirect("/instructor?preview=strategy-map");
  return <InstructorPuzzlePreview />;
}
