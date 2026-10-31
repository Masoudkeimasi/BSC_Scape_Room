import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Persepolis Foods — The Strategy Map Escape Room",
  description:
    "Decode the strategy. Build the scorecard. Escape the vault. A university-level Balanced Scorecard adventure.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
