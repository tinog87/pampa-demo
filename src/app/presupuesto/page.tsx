"use client";

import { useApp } from "@/lib/store";
import { FinanzasPresupuesto } from "@/components/views-finanzas";

export default function Page() {
  const rol = useApp((s) => s.rol);
  // Dirección lo ve de solo lectura; Finanzas puede editar el techo.
  return <FinanzasPresupuesto readOnly={rol === "direccion"} />;
}
