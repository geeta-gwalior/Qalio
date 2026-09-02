"use client";
import BroadcastChannels from "@/components/broadcast-channels";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const user: any = useAuthStore((state) => state.user);

  return (
    <div className="shadow-xl rounded-2xl">
      <BroadcastChannels userRole={user.role} userId={user._id} />
    </div>
  );
}
