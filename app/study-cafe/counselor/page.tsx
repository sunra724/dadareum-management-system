import StudyCafeCounselorView from "@/components/StudyCafeCounselorView";
import { getDadareumDashboard } from "@/lib/db/dadareum";
import { listStudyCafeCheckins } from "@/lib/db/study-cafe";

export const dynamic = "force-dynamic";

export default async function StudyCafeCounselorPage() {
  const [checkins, dashboard] = await Promise.all([
    listStudyCafeCheckins(),
    getDadareumDashboard(),
  ]);

  return <StudyCafeCounselorView checkins={checkins} dashboard={dashboard} />;
}
