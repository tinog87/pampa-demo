import { ZONAS } from "@/lib/data";
import { ZonaDetail } from "@/components/ZonaDetail";

export function generateStaticParams() {
  return ZONAS.map((z) => ({ id: z.id }));
}

export default async function ZonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ZonaDetail id={id} />;
}
