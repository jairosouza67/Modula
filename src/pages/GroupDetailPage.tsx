import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Settings, Users, Trash2, Shield, ShieldOff,
  UserMinus, Check, X, MessageSquare, Clock, Edit2, Globe, Lock,
  Link as LinkIcon, Key, Copy, Plus
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useGroupDetail } from "@/hooks/useGroupDetail";
import { useGroupAdmin } from "@/hooks/useGroupAdmin";
import { useGroupBlocked } from "@/hooks/useGroupBlocked";
import { useGroupJoinRequests } from "@/hooks/useGroupJoinRequests";
import { useGroupAccess } from "@/hooks/useGroupAccess";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeed } from "@/hooks/useFeed";
import { CheckinCard } from "@/components/features/CheckinCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const GroupDetailPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { group, members, checkins = [], isOwner, isLoading } = useGroupDetail(groupId);
  const { isMember, isCheckingAccess, joinWithPassword, isJoining } = useGroupAccess(groupId);
  const admin = useGroupAdmin(groupId);
  const { toggleLike, deleteCheckin, editCheckin } = useFeed();
  const { data: blockedUsers = [] } = useGroupBlocked(isOwner ? groupId : undefined);
  const { data: joinRequests = [] } = useGroupJoinRequests(isOwner ? groupId : undefined);
  const setCheckinOpen = useAppStore(state => state.setCheckinOpen);
  const setSelectedGroupId = useAppStore(state => state.setSelectedGroupId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", type: "public", password: "" });
  const [passwordInput, setPasswordInput] = useState("");

  if (isLoading || isCheckingAccess) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Grupo não encontrado.
        <Button variant="link" onClick={() => navigate("/groups")}>Voltar</Button>
      </div>
    );
  }

  // Private group access gate
  if (group.group_type === "private" && !isMember && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
        <button onClick={() => navigate("/groups")} className="self-start text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-2xl">
          {group.name.charAt(0)}
        </div>
        <div className="text-center space-y-1">
          <h1 className="font-heading font-bold text-xl text-foreground">{group.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock size={14} /> Grupo privado
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-card">
          <p className="text-sm text-center text-card-foreground">
            Este grupo é privado. Solicite um link de convite ao administrador ou entre com a senha.
          </p>
          <Input
            type="password"
            placeholder="Senha do grupo"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="rounded-xl"
          />
          <Button
            onClick={() => joinWithPassword(passwordInput)}
            disabled={isJoining || !passwordInput}
            className="w-full rounded-xl"
          >
            {isJoining ? "Entrando..." : "Entrar com senha"}
          </Button>
        </div>
      </div>
    );
  }

  const inviteLink = `${window.location.origin}/groups/join/${groupId}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link de convite copiado!");
  };

  const openEdit = () => {
    setEditForm({ name: group.name, description: group.description, type: group.group_type, password: "" });
    setEditOpen(true);
  };

  const handleDeleteGroup = () => {
    admin.deleteGroup();
    navigate("/groups");
  };

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/groups")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-xl bg-gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
          {group.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-heading font-bold text-lg text-foreground truncate">{group.name}</h1>
            {group.group_type === "private" ? <Lock size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">👥 {group.member_count} membros</p>
        </div>
        {isOwner && (
          <div className="flex gap-1.5">
            <Button size="icon" variant="ghost" onClick={copyInviteLink} className="rounded-xl" title="Copiar link de convite">
              <Copy size={16} />
            </Button>
            <Button size="icon" variant="ghost" onClick={openEdit} className="rounded-xl">
              <Edit2 size={16} />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleteOpen(true)} className="rounded-xl text-destructive hover:text-destructive">
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      {group.description && (
        <p className="text-sm text-muted-foreground bg-card rounded-xl p-3">{group.description}</p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="posts" className="flex-1 rounded-lg gap-1.5 text-xs">
            <MessageSquare size={14} /> Posts
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-lg gap-1.5 text-xs">
            <Users size={14} /> Membros
          </TabsTrigger>
          {isOwner && (
            <>
              <TabsTrigger value="requests" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Clock size={14} /> Pedidos {joinRequests.length > 0 && `(${joinRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="blocked" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Shield size={14} /> Bloqueados
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-3 mt-3">
          {(isMember || isOwner) && (
            <Button
              onClick={() => {
                if (groupId) {
                  setSelectedGroupId(groupId);
                  setCheckinOpen(true);
                }
              }}
              className="w-full rounded-xl bg-gradient-fire gap-2 shadow-glow-primary h-11"
            >
              <Plus size={18} /> Fazer Check-in no Grupo 🔥
            </Button>
          )}

          {checkins.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground bg-card rounded-xl p-6">Nenhum post neste grupo.</p>
          ) : (
            checkins.map((post: any, i: number) => (
              <CheckinCard
                key={post.id}
                checkin={post}
                index={i}
                userId={user?.id}
                onToggleLike={toggleLike}
                onDelete={setDeleteId}
                onEdit={editCheckin}
              />
            ))
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-2 mt-3">
          {members.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground bg-card rounded-xl p-6">Nenhum membro ainda.</p>
          ) : (
            members.map((member, i) => (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-3 flex items-center gap-3"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {member.username}
                    {member.user_id === group.owner_id && (
                      <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Dono</span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Entrou {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {isOwner && member.user_id !== user?.id && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setRemoveConfirm(member.user_id)} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
                      <UserMinus size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setBlockConfirm(member.user_id)} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
                      <Shield size={14} />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Join Requests Tab (owner only) */}
        <TabsContent value="requests" className="space-y-2 mt-3">
          {joinRequests.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground bg-card rounded-xl p-6">Nenhuma solicitação pendente.</p>
          ) : (
            joinRequests.map((req, i) => (
              <motion.div
                key={req.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-3 flex items-center gap-3"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={req.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {req.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{req.username}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Solicitou {formatDistanceToNow(new Date(req.requested_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => admin.approveJoinRequest(req.user_id)} className="h-7 px-2 text-xs text-primary">
                    <Check size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => admin.rejectJoinRequest(req.user_id)} className="h-7 px-2 text-xs text-destructive">
                    <X size={14} />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Blocked Users Tab (owner only) */}
        <TabsContent value="blocked" className="space-y-2 mt-3">
          {blockedUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground bg-card rounded-xl p-6">Nenhum usuário bloqueado.</p>
          ) : (
            blockedUsers.map((blocked, i) => (
              <motion.div
                key={blocked.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-3 flex items-center gap-3"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={blocked.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                    {blocked.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{blocked.username}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => admin.unblockUser(blocked.user_id)} className="h-7 px-2 text-xs gap-1 text-muted-foreground">
                  <ShieldOff size={14} /> Desbloquear
                </Button>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Group Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar Grupo</DialogTitle>
            <DialogDescription>Altere as informações do grupo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl resize-none" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditForm(f => ({ ...f, type: "public" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${editForm.type === "public" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                  <Globe size={14} /> Público
                </button>
                <button type="button" onClick={() => setEditForm(f => ({ ...f, type: "private" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${editForm.type === "private" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                  <Lock size={14} /> Privado
                </button>
              </div>
            </div>
            {editForm.type === "private" && (
              <div className="space-y-2">
                <Label>Senha do grupo</Label>
                <Input
                  type="password"
                  placeholder="Deixe vazio para remover a senha"
                  value={editForm.password}
                  onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Se preenchida, membros precisarão da senha para entrar. Deixe em branco para permitir apenas entrada por link de convite.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => { admin.updateGroup(editForm); setEditOpen(false); }} disabled={admin.isUpdating} className="rounded-xl">
              {admin.isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. Todos os membros serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirm */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>O usuário será removido do grupo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (removeConfirm) admin.removeMember(removeConfirm); setRemoveConfirm(null); }} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block User Confirm */}
      <AlertDialog open={!!blockConfirm} onOpenChange={() => setBlockConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>O usuário será removido e impedido de entrar novamente no grupo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (blockConfirm) admin.blockUser(blockConfirm); setBlockConfirm(null); }} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default GroupDetailPage;
