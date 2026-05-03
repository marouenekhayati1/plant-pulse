import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { UTILITIES, type UtilityKind, utilityLabel } from "@/lib/utilities";
import { COMPUTED_LABELS, SCHEMAS } from "@/lib/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/history")({ component: () => <AppShell><History /></AppShell> });

type Reading = {
  id: string;
  utility: UtilityKind;
  technician_name: string;
  technician_matricule: string;
  guard_post: number;
  data: Record<string, any>;
  computed: Record<string, any>;
  anomaly: boolean;
  recorded_at: string;
  comment: string | null;
};

function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [tab, setTab] = useState<UtilityKind>(UTILITIES[0].value);

  useEffect(() => {
    supabase.from("utility_readings").select("*").order("recorded_at", { ascending: false }).limit(2000).then(({ data }) => setReadings((data ?? []) as Reading[]));
  }, []);

  const filtered = useMemo(() => {
    return readings.filter((r) => {
      const t = new Date(r.recorded_at).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  }, [readings, from, to]);

  const byUtility = useMemo(() => {
    const m = new Map<UtilityKind, Reading[]>();
    UTILITIES.forEach((u) => m.set(u.value, []));
    filtered.forEach((r) => m.get(r.utility)?.push(r));
    return m;
  }, [filtered]);

  function buildRows(util: UtilityKind, list: Reading[]) {
    const schema = SCHEMAS[util];
    const fieldKeys = schema.fields.map((f) => f.key);
    const computedKeys = Array.from(
      new Set(list.flatMap((r) => Object.keys(r.computed || {}))),
    );
    const headers = [
      "Date", "Heure", "Poste", "Technicien", "Matricule",
      ...schema.fields.map((f) => f.unit ? `${f.label} (${f.unit})` : f.label),
      ...computedKeys.map((k) => {
        const c = COMPUTED_LABELS[k];
        return c ? (c.unit ? `${c.label} (${c.unit})` : c.label) : k;
      }),
      "Anomalie", "Commentaire",
    ];
    const rows = list.map((r) => {
      const d = new Date(r.recorded_at);
      return [
        d.toLocaleDateString("fr-FR"),
        d.toLocaleTimeString("fr-FR"),
        `P${r.guard_post}`,
        r.technician_name,
        r.technician_matricule,
        ...fieldKeys.map((k) => r.data?.[k] ?? ""),
        ...computedKeys.map((k) => r.computed?.[k] ?? ""),
        r.anomaly ? "Oui" : "Non",
        r.comment ?? "",
      ];
    });
    return { headers, rows };
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    UTILITIES.forEach((u) => {
      const list = byUtility.get(u.value) ?? [];
      const { headers, rows } = buildRows(u.value, list);
      const aoa = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = headers.map(() => ({ wch: 18 }));
      const sheetName = u.label.substring(0, 31).replace(/[\\/?*[\]:]/g, "");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    const range = `${from || "debut"}_${to || "fin"}`;
    XLSX.writeFile(wb, `releves_${range}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Historique</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} relevé(s) sur la période</p>
        </div>
        <Button onClick={exportExcel} size="lg" className="gap-2">
          <Download className="h-4 w-4" /> Exporter Excel
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Du</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Au</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as UtilityKind)}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {UTILITIES.map((u) => (
            <TabsTrigger key={u.value} value={u.value} className="gap-1">
              <span>{u.icon}</span>
              <span>{u.label}</span>
              <Badge variant="secondary" className="ml-1">{byUtility.get(u.value)?.length ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {UTILITIES.map((u) => {
          const list = byUtility.get(u.value) ?? [];
          const { headers, rows } = buildRows(u.value, list);
          return (
            <TabsContent key={u.value} value={u.value}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{u.icon} {u.label}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h, i) => (
                          <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={list[i].id}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="whitespace-nowrap font-mono text-xs">
                              {j === headers.length - 2 && cell === "Oui" ? (
                                <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Oui</Badge>
                              ) : String(cell)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={headers.length} className="py-8 text-center text-sm text-muted-foreground">
                            Aucun relevé pour cette utilité.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
