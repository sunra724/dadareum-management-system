import StudyCafeAdmin from "@/components/StudyCafeAdmin";
import { listStudyCafeCheckins } from "@/lib/db/study-cafe";
import { getAppUrl } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudyCafePage() {
  const checkins = await listStudyCafeCheckins();
  const checkinUrl = `${getAppUrl()}/study-cafe/checkin`;
  const counselorUrl = `${getAppUrl()}/study-cafe/counselor`;

  return <StudyCafeAdmin initialCheckins={checkins} checkinUrl={checkinUrl} counselorUrl={counselorUrl} />;
}
