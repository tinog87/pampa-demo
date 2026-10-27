import { Suspense } from "react";
import { ComercioFicha } from "@/components/ComercioFicha";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Cargando…</div>}>
      <ComercioFicha />
    </Suspense>
  );
}
