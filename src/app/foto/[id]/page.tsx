import Link from "next/link";
import { FOTOS, getComercio, getFotoByComercio } from "@/lib/data";
import { cn } from "@/lib/format";
import { FridgeSvg } from "@/components/FridgeSvg";
import { Badge, Card, Note } from "@/components/ui";

export function generateStaticParams() {
  return FOTOS.map((f) => ({ id: f.comercioId }));
}

export default async function FotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const foto = getFotoByComercio(id);
  const c = getComercio(id);

  if (!foto || !c) {
    return (
      <div>
        <Link href="/foto" className="text-sm text-muted hover:text-ink">
          ← Fotos
        </Link>
        <p className="mt-6 text-sm text-muted">No hay foto para este comercio.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/foto" className="text-sm text-muted hover:text-ink">
        ← Fotos
      </Link>

      <div className="mt-4 mb-8">
        <span className="brand-rule mb-3" />
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
          {c.nombre}
        </h1>
        <div className="mt-2 text-sm text-muted">
          Control de foto · visita {foto.visita} · {foto.fecha} ·{" "}
          <Link href={`/comercio/${c.id}`} className="underline underline-offset-2 hover:text-ink">
            ver comercio
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Foto */}
        <div>
          <FridgeSvg estado={foto.estadoHeladera} />
          <p className="mt-2 text-center text-xs text-faint">
            Reconstrucción esquemática de la foto de la visita.
          </p>
        </div>

        {/* Lectura */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Lo que lee la IA</h2>
          <Card className="divide-y divide-line">
            {foto.lectura.map((l) => (
              <div key={l.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm text-muted">{l.label}</span>
                <span className="flex items-center gap-2 text-right text-sm font-medium text-ink">
                  {l.valor}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      l.confianza === "alta"
                        ? "bg-ok-bg text-ok-ink"
                        : l.confianza === "media"
                          ? "bg-warn-bg text-warn-ink"
                          : "bg-bad-bg text-bad-ink"
                    )}
                  >
                    {l.confianza}
                  </span>
                </span>
              </div>
            ))}
          </Card>

          {/* Verificación de acuerdo */}
          {foto.acuerdo ? (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Acuerdo de exhibición: lo pactado vs la foto
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-120 border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink text-left text-xs font-medium text-white">
                      <th className="rounded-l-md px-3 py-2 font-medium">Lo pactado</th>
                      <th className="px-3 py-2 font-medium">Lo que muestra la foto</th>
                      <th className="rounded-r-md px-3 py-2 font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foto.acuerdo.map((a, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="px-3 py-2.5 text-ink-soft">{a.pactado}</td>
                        <td className="px-3 py-2.5 text-ink-soft">{a.foto}</td>
                        <td className="px-3 py-2.5">
                          <Badge tono={a.cumple ? "ok" : "bad"} dot>
                            {a.cumple ? "Cumple" : "No cumple"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Qué hace / qué no */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <div className="mb-1 text-sm font-semibold text-ink">Qué hace la IA</div>
              <Note>
                Revisa muchas fotos rápido, cuenta espacio y cabeceras, y marca lo que no
                coincide con el acuerdo. Cada dato trae su confianza.
              </Note>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm font-semibold text-ink">Qué no hace</div>
              <Note>
                No decide ni sanciona. Si la foto es dudosa o el monto es alto, confirma una
                persona. Cortar o renegociar lo decide siempre alguien.
              </Note>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
