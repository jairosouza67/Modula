import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetail } from "@/hooks/useGroupDetail";
import { useGroupAccess } from "@/hooks/useGroupAccess";
import { useEffect } from "react";
import { Lock, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GroupJoinPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { group, isLoading } = useGroupDetail(groupId);
  const { isMember, isCheckingAccess, joinWithLink, isJoining } = useGroupAccess(groupId);

  useEffect(() => {
    if (!isCheckingAccess && isMember && groupId) {
      navigate(`/groups/${groupId}`, { replace: true });
    }
  }, [isMember, isCheckingAccess, groupId, navigate]);

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
          <Users size={14} />
          <span>{group.member_count} membros</span>
          {group.group_type === "private" && <Lock size={14} />}
        </div>
        {group.description && (
          <p className="text-sm text-muted-foreground max-w-sm">{group.description}</p>
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-card">
        <p className="text-sm text-card-foreground">
          Você foi convidado para entrar neste grupo!
        </p>
        <Button
          onClick={joinWithLink}
          disabled={isJoining}
          className="w-full rounded-xl"
        >
          {isJoining ? "Entrando..." : "Entrar no Grupo"}
        </Button>
      </div>
    </div>
  );
};

export default GroupJoinPage;
