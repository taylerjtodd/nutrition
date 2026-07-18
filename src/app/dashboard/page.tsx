import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/lib/db";
import DashboardClient from "@/app/dashboard/DashboardClient";

export const revalidate = 0; // force dynamic rendering

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const rawSettings = await getUserSettings(session.user.id);

  // Fallback defaults if user hasn't set targets yet
  const initialSettings = rawSettings ?? {
    focusMacro: "saturatedFat",
    targetSaturatedFat: 20,
    targetCalories: 2000,
    targetProtein: 50,
    targetTotalFat: 65,
    targetCarbs: 260,
  };

  return (
    <>
      <Navbar />
      <DashboardClient
        session={session}
        initialSettings={initialSettings}
      />
    </>
  );
}
