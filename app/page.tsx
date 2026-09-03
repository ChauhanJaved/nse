import { fetchAllIndexesData } from "@/lib/nse";
import DashboardClient from "@/components/DashboardClient";

// Revalidate market data every 15 minutes
export const revalidate = 900;

export default async function HomePage() {
  const indexesData = await fetchAllIndexesData();
  const lastUpdated = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardClient
      data={indexesData}
      lastUpdated={lastUpdated}
    />
  );
}
