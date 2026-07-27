import { useState } from "react";
import { Heart, MessageCircle, Clock, MapPin, Zap, MoreVertical, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CheckinFeedItem } from "@/hooks/useFeed";
import { AvatarPreview } from "./AvatarPreview";

interface CheckinCardProps {
    checkin: CheckinFeedItem;
    index: number;
    userId?: string;
    onToggleLike: (id: string, isLiked: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, title: string, type: string) => void;
}

const workoutImages = ["/placeholder.svg"];

export const CheckinCard = ({
    checkin,
    index,
    userId,
    onToggleLike,
    onDelete,
    onEdit
}: CheckinCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editType, setEditType] = useState("");

    const isOwner = userId === checkin.user_id;
    const isEditing = editingId === checkin.id;

    const startEdit = () => {
        setEditingId(checkin.id);
        setEditTitle(checkin.title);
        setEditType(checkin.type);
    };

    const confirmEdit = () => {
        if (editingId && editTitle.trim()) {
            onEdit(editingId, editTitle.trim(), editType.trim());
            setEditingId(null);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer ${!isExpanded ? "hover:border-primary/30 border border-transparent" : "border-primary/20 border"
                }`}
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        >
            {/* User header */}
            <div className="flex items-center gap-3 p-3 pt-3.5 pb-2">
                <AvatarPreview userId={checkin.user_id} size={40} />
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-card-foreground">
                            {checkin.username || "Guerreiro"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold">
                            Lv.{checkin.level || 1}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tracking-wide">
                            {formatDistanceToNow(new Date(checkin.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {checkin.group_name && (
                            <>
                                <span className="text-muted-foreground text-[10px] opacity-50">•</span>
                                <span className="text-xs font-medium text-primary/80">
                                    {checkin.group_name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 ms-auto">
                    {!isExpanded && (
                        <div className="text-muted-foreground mr-1">
                            <ChevronDown size={14} />
                        </div>
                    )}
                    <div className="bg-accent/15 dark:bg-primary/15 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Zap size={12} className="text-accent-foreground dark:text-primary" />
                        <span className="text-xs font-semibold text-accent-foreground dark:text-primary">
                            +{checkin.xp_earned} XP
                        </span>
                    </div>
                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-full hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical size={16} className="text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={startEdit}>
                                    <Pencil size={14} className="mr-2" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onDelete(checkin.id); }}
                                    className="text-red-500 focus:text-red-500 dark:text-red-400 dark:focus:text-red-400"
                                >
                                    <Trash2 size={14} className="mr-2" />
                                    Remover
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        {/* Image */}
                        <div className="aspect-[4/3] bg-muted overflow-hidden relative border-y border-primary/5">
                            {checkin.image_url ? (
                                <img
                                    src={checkin.image_url}
                                    alt={checkin.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <img
                                    src={workoutImages[index % workoutImages.length]}
                                    alt={checkin.title}
                                    className="w-full h-full object-cover opacity-50"
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className={`p-3.5 pt-2 ${!isExpanded ? "flex items-center justify-between" : "space-y-2.5"}`}>
                <div className={`${!isExpanded ? "flex items-center gap-3 overflow-hidden" : "space-y-2.5"} flex-1 min-w-0`}>
                    <div className={`flex items-center gap-2 ${!isExpanded ? "flex-shrink-0" : ""}`}>
                        {isEditing ? (
                            <Input
                                value={editType}
                                onChange={(e) => setEditType(e.target.value)}
                                className="h-6 text-[10px] w-24"
                                placeholder="Tipo"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {checkin.type}
                            </span>
                        )}
                        {isExpanded && checkin.duration_minutes && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} /> {checkin.duration_minutes}min
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="h-8 text-sm flex-1"
                                placeholder="Título"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmEdit(); }}
                                className="p-1.5 rounded-full bg-primary text-primary-foreground"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                className="p-1.5 rounded-full bg-muted text-muted-foreground"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <p className={`text-sm font-medium text-card-foreground ${!isExpanded ? "truncate" : ""}`}>
                            {checkin.title}
                        </p>
                    )}
                </div>

                <div className={`flex items-center gap-4 ${isExpanded ? "pt-1 px-0.5" : "pl-3"}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLike(checkin.id, !!checkin.liked_by_me); }}
                        className="flex items-center gap-1.5 transition-colors"
                    >
                        <Heart
                            size={18}
                            className={checkin.liked_by_me ? "fill-primary text-primary" : "text-muted-foreground"}
                        />
                        <span className={`text-xs font-medium ${checkin.liked_by_me ? "text-primary" : "text-muted-foreground"}`}>
                            {checkin.likes_count || 0}
                        </span>
                    </button>
                    {isExpanded && (
                        <button className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <MessageCircle size={18} className="text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{checkin.comments_count || 0}</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
