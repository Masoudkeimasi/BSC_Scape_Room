import { GameApp } from "@/components/GameApp";
export default async function Page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <GameApp view="room" room={Number(roomId)} />;
}
