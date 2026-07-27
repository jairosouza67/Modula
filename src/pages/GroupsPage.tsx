import { motion } from "framer-motion";
import { Users, Lock, Search, Plus, Globe, Key } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useMyGroups } from "@/hooks/useMyGroups";
import { useCreateGroup } from "@/hooks/useCreateGroup";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const GroupsPage = () => {
  const { data: groups = [], isLoading } = useGroups();
  const { data: myGroups = [], isLoading: myGroupsLoading } = useMyGroups();
  const createGroup = useCreateGroup();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [newGroup, setNewGroup] = useState({ name: "", description: "", type: "public" as "public" | "private", password: "" });
  const [tab, setTab] = useState<"public" | "my">("public");

  const currentList = tab === "public" ? groups : myGroups;
  const filtered = currentList.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newGroup.name.trim()) {
      toast.error("Insira o nome do grupo");
      return;
    }
    createGroup.mutate(newGroup, {
      onSuccess: () => {
        toast.success("Grupo criado com sucesso!");
        setDialogOpen(false);
        setNewGroup({ name: "", description: "", type: "public", password: "" });
      },
      onError: (err: any) => {
        toast.error(err.message || "Erro ao criar grupo");
      },
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <Users size={22} className="text-primary" />
          Grupos
        </h1>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="rounded-xl gap-1.5"
        >
          <Plus size={16} />
          Criar Grupo
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("public")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "public"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border"
          }`}
        >
          <Globe size={14} className="inline mr-1.5" />
          Públicos
        </button>
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "my"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border"
          }`}
        >
          <Users size={14} className="inline mr-1.5" />
          Meus Grupos
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar grupos..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>


      {/* Group list */}
      {(tab === "public" ? isLoading : myGroupsLoading) ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl shadow-card">
          {tab === "public" ? "Nenhum grupo público encontrado." : "Você não participa de nenhum grupo."}
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {filtered.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="bg-card rounded-xl p-4 shadow-card flex items-center gap-3 hover:shadow-elevated transition-shadow duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
                {group.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-heading font-semibold text-sm text-card-foreground truncate">
                    {group.name}
                  </p>
                  {group.type === "private" && <Lock size={12} className="text-muted-foreground shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  👥 {group.memberCount} membros
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar seu grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input
                id="group-name"
                placeholder="Ex: Treino às 6h"
                value={newGroup.name}
                onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Descrição</Label>
              <Textarea
                id="group-desc"
                placeholder="Descreva o objetivo do grupo..."
                value={newGroup.description}
                onChange={(e) => setNewGroup((g) => ({ ...g, description: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewGroup((g) => ({ ...g, type: "public" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    newGroup.type === "public"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Globe size={14} />
                  Público
                </button>
                <button
                  type="button"
                  onClick={() => setNewGroup((g) => ({ ...g, type: "private" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    newGroup.type === "private"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Lock size={14} />
                  Privado
                </button>
              </div>
            </div>
            {newGroup.type === "private" && (
              <div className="space-y-2">
                <Label htmlFor="group-password">Senha do grupo</Label>
                <Input
                  id="group-password"
                  type="password"
                  placeholder="Senha para entrar no grupo"
                  value={newGroup.password}
                  onChange={(e) => setNewGroup((g) => ({ ...g, password: e.target.value }))}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Membros poderão entrar usando esta senha ou um link de convite.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createGroup.isPending}
              className="rounded-xl gap-1.5"
            >
              {createGroup.isPending ? "Criando..." : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Entry Dialog */}
      <Dialog open={!!passwordDialogOpen} onOpenChange={() => { setPasswordDialogOpen(null); setPasswordInput(""); }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Entrar com Senha</DialogTitle>
            <DialogDescription>
              Digite o ID do grupo e a senha para entrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Senha do grupo"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordDialogOpen(null); setPasswordInput(""); }} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={() => { /* handled in GroupDetailPage */ setPasswordDialogOpen(null); }} className="rounded-xl">
              Entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;
