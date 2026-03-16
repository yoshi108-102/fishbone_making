import FishboneBoard from "../components/FishboneBoard";
import { readFishboneDocument } from "../lib/fishbone-storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialDocument = await readFishboneDocument();

  return <FishboneBoard initialDocument={initialDocument} />;
}
