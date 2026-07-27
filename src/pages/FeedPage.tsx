import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeed } from "@/hooks/useFeed";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckinCard } from "@/components/features/CheckinCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FeedPage = () => {
  const { feed = [], isLoading, toggleLike, deleteCheckin, editCheckin } = useFeed();
  const setCheckinOpen = useAppStore((state) => state.setCheckinOpen);
  const { user } = useAuthStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4 py-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
      {/* Quick Check-in Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setCheckinOpen(true)}
        className="w-full md:col-span-2 py-3.5 rounded-xl bg-gradient-fire text-primary-foreground font-heading font-semibold text-base flex items-center justify-center gap-2 shadow-glow-primary md:hidden"
      >
        <Plus size={20} />
        Check-in Rápido
      </motion.button>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O check-in será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteCheckin(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feed */}
      <AnimatePresence>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : feed?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl shadow-card">
            Nenhum check-in ainda. Seja o primeiro! 🔥
          </div>
        ) : (
          feed?.map((checkin, index) => (
            <CheckinCard
              key={checkin.id}
              checkin={checkin}
              index={index}
              userId={user?.id}
              onToggleLike={toggleLike}
              onDelete={setDeleteId}
              onEdit={editCheckin}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedPage;
