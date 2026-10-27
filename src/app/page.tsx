"use client";

import { useApp } from "@/lib/store";
import { PreventistaHoy } from "@/components/views-preventista";
import { SupervisorAprobar } from "@/components/views-supervisor";
import { GerenteBandeja } from "@/components/views-gerente";
import { TradeReglas } from "@/components/views-trade";
import { FinanzasPresupuesto, DireccionResumen } from "@/components/views-finanzas";

export default function Home() {
  const rol = useApp((s) => s.rol);
  switch (rol) {
    case "preventista":
      return <PreventistaHoy />;
    case "supervisor":
      return <SupervisorAprobar />;
    case "trade":
      return <TradeReglas />;
    case "finanzas":
      return <FinanzasPresupuesto />;
    case "direccion":
      return <DireccionResumen />;
    default:
      return <GerenteBandeja />;
  }
}
