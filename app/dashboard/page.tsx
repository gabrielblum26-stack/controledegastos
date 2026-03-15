import { getMonthlySummary } from "@/lib/summary";
import DashboardClient from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>;
}) {
  const params = await searchParams;
  const selectedProfile = params.perfil === "mulher" ? "mulher" : "marido";
  const summary = await getMonthlySummary();

  return <DashboardClient initialSummary={summary} selectedProfile={selectedProfile} />;
}
