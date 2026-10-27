import { COMERCIOS } from "@/lib/data";
import { ComercioDetail } from "@/components/ComercioDetail";

export function generateStaticParams() {
  return COMERCIOS.map((c) => ({ id: c.id }));
}

export default async function ComercioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComercioDetail id={id} />;
}
