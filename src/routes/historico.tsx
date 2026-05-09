import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateBR } from "@/lib/format";
import { CheckCircle2, AlertTriangle, Eye, ChevronLeft, ChevronRight, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";

import type { Movimentacao } from "@/lib/totals";

type Fechamento = {
  id: string;
  caixa_id: string | null;
  data: string;
  valor_abertura: number;
  total_geral_entradas: number;
  total_geral_saidas: number;
  saldo_final: number;
  deposito_final: number;
  caixa_bateu: boolean;
  observacao: string | null;
  fechado_em: string | null;
};

function HistoricoPage() {
  const navigate = useNavigate();
  const [search, setSearchState] = useState({
    mes: "todos",
    status: "todos",
    dataDe: "",
    dataAte: "",
    busca: "",
    ordem: "desc",
    pagina: 1,
    pageSize: 10
  });
  const { mes, status, dataDe, dataAte, busca, ordem, pagina, pageSize } = search;
  const [detalhe, setDetalhe] = useState<Fechamento | null>(null);

  const setSearch = (updates: Partial<typeof search>, resetPage = true) => {
    setSearchState(prev => ({ ...prev, ...updates, ...(resetPage ? { pagina: 1 } : {}) }));
  };

  // Lista de meses disponíveis (consulta leve, só 'data')
  const { data: mesesData = [] } = useQuery({
    queryKey: ["fechamentos-meses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fechamentos")
        .select("data")
        .order("data", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as { data: string }[];
    },
  });

  const meses = useMemo(() => {
    const set = new Set<string>();
    mesesData.forEach((f) => set.add(f.data.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [mesesData]);

  // Query paginada no servidor
  const { data: pageResult, isFetching } = useQuery({
    queryKey: ["fechamentos", { mes, status, dataDe, dataAte, busca, ordem, pagina, pageSize }],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let q = supabase
        .from("fechamentos")
        .select("*", { count: "exact" });

      if (mes !== "todos") {
        const inicioMes = mes + "-01";
        const [y, m] = mes.split("-").map(Number);
        const proxMes = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
        q = q.gte("data", inicioMes).lt("data", proxMes);
      }
      if (dataDe) q = q.gte("data", dataDe);
      if (dataAte) q = q.lte("data", dataAte);
      if (status === "bateu") q = q.eq("caixa_bateu", true);
      if (status === "nao_bateu") q = q.eq("caixa_bateu", false);
      if (busca) q = q.ilike("observacao", `%${busca}%`);

      q = q.order("data", { ascending: ordem === "asc" });

      const from = (pagina - 1) * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return { items: (data ?? []) as Fechamento[], count: count ?? 0 };
    },
  });

  const items = pageResult?.items ?? [];
  const total = pageResult?.count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const limparFiltros = () =>
    setSearch({ mes: "todos", status: "todos", dataDe: "", dataAte: "", busca: "" });

  const algumFiltroAtivo =
    mes !== "todos" || status !== "todos" || !!dataDe || !!dataAte || !!busca;

  const StatusBadge = ({ ok }: { ok: boolean }) =>
    ok ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
        <CheckCircle2 className="h-3.5 w-3.5" /> Bateu
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger)]/15 px-2 py-0.5 text-xs font-medium text-[var(--danger)]">
        <AlertTriangle className="h-3.5 w-3.5" /> Não bateu
      </span>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Fechamentos</h1>
        <p className="text-sm text-muted-foreground">Consulte fechamentos anteriores</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          {algumFiltroAtivo && (
            <Button size="sm" variant="ghost" onClick={limparFiltros}>Limpar</Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mês</label>
            <Select value={mes} onValueChange={(v) => setSearch({ mes: v })}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {meses.map((m) => (
                  <SelectItem key={m} value={m}>
                    {new Date(m + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setSearch({ status: v as typeof status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="bateu">Caixa Bateu</SelectItem>
                <SelectItem value="nao_bateu">Não Bateu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Buscar (observação)</label>
            <Input
              placeholder="Texto na observação"
              value={busca}
              onChange={(e) => setSearch({ busca: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">De</label>
            <Input type="date" value={dataDe} onChange={(e) => setSearch({ dataDe: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Até</label>
            <Input type="date" value={dataAte} onChange={(e) => setSearch({ dataAte: e.target.value })} />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-muted-foreground">
              {total} fechamento(s){isFetching ? " · atualizando..." : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSearch({ ordem: ordem === "desc" ? "asc" : "desc" }, false)}
          className="self-start"
        >
          {ordem === "desc" ? (
            <><ArrowDownWideNarrow className="mr-2 h-4 w-4" /> Mais recente primeiro</>
          ) : (
            <><ArrowUpWideNarrow className="mr-2 h-4 w-4" /> Mais antigo primeiro</>
          )}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Por página:</span>
          <Select value={String(pageSize)} onValueChange={(v) => setSearch({ pageSize: Number(v) })}>
            <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela — desktop/tablet */}
      <Card className="hidden md:block">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Abertura</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo Final</TableHead>
                <TableHead className="text-right">Depósito</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum fechamento encontrado</TableCell></TableRow>
              ) : items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{formatDateBR(f.data)}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.valor_abertura)}</TableCell>
                  <TableCell className="text-right text-[var(--success)]">{formatBRL(f.total_geral_entradas)}</TableCell>
                  <TableCell className="text-right text-[var(--danger)]">{formatBRL(f.total_geral_saidas)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(f.saldo_final)}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.deposito_final)}</TableCell>
                  <TableCell><StatusBadge ok={f.caixa_bateu} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setDetalhe(f)}>
                      <Eye className="mr-1 h-3 w-3" /> Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cards — mobile */}
      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum fechamento encontrado</CardContent></Card>
        ) : items.map((f) => (
          <Card key={f.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatDateBR(f.data)}</span>
                <StatusBadge ok={f.caixa_bateu} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Abertura</div>
                  <div>{formatBRL(f.valor_abertura)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Saldo Final</div>
                  <div className="font-semibold">{formatBRL(f.saldo_final)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Entradas</div>
                  <div className="text-[var(--success)]">{formatBRL(f.total_geral_entradas)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Saídas</div>
                  <div className="text-[var(--danger)]">{formatBRL(f.total_geral_saidas)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Depósito</div>
                  <div>{formatBRL(f.deposito_final)}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setDetalhe(f)}>
                <Eye className="mr-1 h-3 w-3" /> Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Página {paginaAtual} de {totalPaginas} · {total} registro(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSearch({ pagina: Math.max(1, paginaAtual - 1) }, false)}
              disabled={paginaAtual === 1}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSearch({ pagina: Math.min(totalPaginas, paginaAtual + 1) }, false)}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DetalhesDialog fechamento={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}

function DetalhesDialog({ fechamento, onClose }: { fechamento: Fechamento | null; onClose: () => void }) {
  const { data: movs = [] } = useQuery({
    queryKey: ["mov-historico", fechamento?.caixa_id],
    enabled: !!fechamento?.caixa_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("caixa_id", fechamento!.caixa_id!)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Movimentacao[];
    },
  });

  const groups: Record<string, Movimentacao[]> = {
    pix: [], cartao: [], dinheiro: [],
  };
  movs.forEach((m) => {
    const k = m.forma_pagamento === "transferencia" ? "pix" : m.forma_pagamento;
    groups[k]?.push(m);
  });

  return (
    <Dialog open={!!fechamento} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Fechamento de {fechamento ? formatDateBR(fechamento.data) : ""}
          </DialogTitle>
          <DialogDescription>
            {fechamento?.observacao || "Sem observações"}
          </DialogDescription>
        </DialogHeader>

        {(["pix", "cartao", "dinheiro"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <h3 className="font-semibold capitalize">{k}</h3>
            {groups[k].length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups[k].map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.numero_pedido || "—"}</TableCell>
                      <TableCell>{m.maquineta || m.banco || "—"}</TableCell>
                      <TableCell className="capitalize">{m.tipo}</TableCell>
                      <TableCell className={"text-right " + (m.tipo === "saida" ? "text-[var(--danger)]" : "text-[var(--success)]")}>
                        {m.tipo === "saida" ? "- " : ""}{formatBRL(m.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export default HistoricoPage;
