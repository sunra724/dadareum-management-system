import StudyCafeCounselorView from "@/components/StudyCafeCounselorView";
import { listStudyCafeCheckins } from "@/lib/db/study-cafe";

export const dynamic = "force-dynamic";

export default async function StudyCafeCounselorPage() {
  const checkins = await listStudyCafeCheckins();
  return <StudyCafeCounselorView checkins={checkins} />;
}
