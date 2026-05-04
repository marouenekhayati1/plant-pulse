import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: LoginPage });

type Tech = { id: string; matricule: string; first_name: string; last_name: string; role: "technician" | "maintenance_manager" | "admin" };

function LoginPage() {
  const { login, tech } = useAuth();
  const navigate = useNavigate();
  const [techs, setTechs] = useState<Tech[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Tech | null>(null);
  const [matricule, setMatricule] = useState("");
  const [loading, setLoading] = useState(false);

  // new tech form
  const [nFirst, setNFirst] = useState("");
  const [nLast, setNLast] = useState("");
  const [nMat, setNMat] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tech) navigate({ to: "/dashboard" });
  }, [tech, navigate]);

  useEffect(() => {
    supabase.from("technicians").select("*").eq("active", true).order("last_name").then(({ data }) => {
      if (data) setTechs(data as Tech[]);
    });
  }, []);

  async function handleLogin() {
    if (!selected) return toast.error("Sélectionnez votre nom");
    if (!matricule.trim()) return toast.error("Saisissez votre matricule");
    setLoading(true);
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .eq("id", selected.id)
      .eq("matricule", matricule.trim())
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error("Matricule incorrect");
      return;
    }
    login(data as Tech);
    toast.success(`Bienvenue ${data.first_name}`);
    navigate({ to: "/dashboard" });
  }

  async function handleCreate() {
    if (!nFirst.trim() || !nLast.trim() || !nMat.trim()) {
      return toast.error("Tous les champs sont requis");
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("technicians")
      .insert({ first_name: nFirst.trim(), last_name: nLast.trim(), matricule: nMat.trim(), role: "technician" })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Matricule déjà utilisé" : error.message);
      return;
    }
    login(data as Tech);
    toast.success("Compte créé");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md border-border/60 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Activity className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">INDUS Monitoring</CardTitle>
          <CardDescription>Système de suivi des utilités industrielles</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login"><LogIn className="mr-2 h-4 w-4" />Connexion</TabsTrigger>
              <TabsTrigger value="new"><UserPlus className="mr-2 h-4 w-4" />Nouveau</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Technicien</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                      {selected ? `${selected.first_name} ${selected.last_name}` : "Sélectionner un nom..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Rechercher..." />
                      <CommandList>
                        <CommandEmpty>Aucun technicien.</CommandEmpty>
                        <CommandGroup>
                          {techs.map((t) => (
                            <CommandItem key={t.id} value={`${t.first_name} ${t.last_name}`} onSelect={() => { setSelected(t); setOpen(false); }}>
                              {t.first_name} {t.last_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input type="password" inputMode="numeric" className="h-12 tracking-widest" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="••••••" />
              </div>
              <Button className="h-12 w-full text-base" onClick={handleLogin} disabled={loading}>
                {loading ? "Vérification…" : "Se connecter"}
              </Button>
            </TabsContent>
            <TabsContent value="new" className="space-y-3 pt-4">
              <div className="space-y-2"><Label>Prénom</Label><Input className="h-11" value={nFirst} onChange={(e) => setNFirst(e.target.value)} /></div>
              <div className="space-y-2"><Label>Nom</Label><Input className="h-11" value={nLast} onChange={(e) => setNLast(e.target.value)} /></div>
              <div className="space-y-2"><Label>Matricule (unique)</Label><Input className="h-11" value={nMat} onChange={(e) => setNMat(e.target.value)} /></div>
              <Button className="h-12 w-full" onClick={handleCreate} disabled={creating}>
                {creating ? "Création…" : "Créer mon compte"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
