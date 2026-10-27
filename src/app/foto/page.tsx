import Link from "next/link";
import { FOTOS, getComercio } from "@/lib/data";
import { CONTEXTO_NACIONAL } from "@/lib/data";
import { FridgeSvg } from "@/components/FridgeSvg";
import { Card, Note, PageTitle } from "@/components/ui";

export default function FotoIndexPage() {
  return (
    <div>
      <PageTitle sub="La misma foto que saca el preventista en la visita sirve para dos cosas: explicar por qué una heladera rinde poco, y controlar los acuerdos de exhibición.">
        Fotos · lectura con IA
      </PageTitle>

      <Card className="mb-8 p-5">
        <Note>
          En las 10 semanas, la foto se saca solo en las ~
          {CONTEXTO_NACIONAL.subutilizadas.toLocaleString("es-AR")} heladeras que la compra
          marca como subutilizadas (1 de cada 5), en las zonas piloto. La IA lee; una persona
          decide. La alerta automática se activa recién cuando la IA demuestra su precisión.
        </Note>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FOTOS.map((f) => {
          const c = getComercio(f.comercioId);
          return (
            <Link
              key={f.id}
              href={`/foto/${f.comercioId}`}
              className="group rounded-lg border border-line bg-paper p-4 transition-colors hover:border-ink"
            >
              <div className="mb-3">
                <FridgeSvg estado={f.estadoHeladera} />
              </div>
              <div className="text-sm font-semibold text-ink group-hover:underline">
                {c?.nombre ?? f.comercioId}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                Visita {f.visita} · {f.fecha}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
