import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Scale, Percent, CheckCircle, TrendingDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BodyMetricsPage() {
    const { user } = useAuthStore();
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [weight, setWeight] = useState("");
    const [fat, setFat] = useState("");
    const [lean, setLean] = useState("");

    useEffect(() => {
        fetchMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchMetrics = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("body_metrics")
                .select("*")
                .eq("user_id", user.id)
                .order("measured_at", { ascending: true }); // chronological for chart

            if (error) throw error;
            setMetrics(data || []);
        } catch (error: any) {
            toast.error("Erro ao carregar métricas: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!weight || !fat || !lean) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                user_id: user.id,
                weight: parseFloat(weight),
                body_fat_percent: parseFloat(fat),
                lean_mass: parseFloat(lean),
            };

            const { error } = await supabase.from("body_metrics").insert(payload);
            if (error) throw error;

            toast.success("Métricas salvas com sucesso!");
            setWeight("");
            setFat("");
            setLean("");
            fetchMetrics();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const chartData = metrics.map((m) => ({
        date: new Date(m.measured_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        weight: m.weight,
        fat: m.body_fat_percent,
        lean: m.lean_mass,
    }));

    const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;

    return (
        <div className="space-y-4 py-4 px-2 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/20">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-heading font-black text-card-foreground">Bioimpedância</h1>
                    <p className="text-sm text-muted-foreground">Acompanhe sua evolução física real</p>
                </div>
            </div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
            >
                <h3 className="font-heading font-bold mb-4">Nova Medição</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Scale size={12} /> Peso (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="Ex: 80.5"
                                className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Percent size={12} /> BF (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                                placeholder="Ex: 15.0"
                                className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Activity size={12} /> Massa Magra (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={lean}
                                onChange={(e) => setLean(e.target.value)}
                                placeholder="Ex: 65.0"
                                className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Salvando..." : <><CheckCircle size={18} /> Registrar Medidas</>}
                    </button>
                </form>
            </motion.div>

            {/* Evolution Chart */}
            {metrics.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-heading font-bold flex items-center gap-2">
                            <TrendingDown className="text-primary" size={18} />
                            Evolução
                        </h3>
                        {latest && (
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                Última: {latest.body_fat_percent}% BF
                            </div>
                        )}
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                                />
                                <Line type="monotone" dataKey="fat" name="BF (%)" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="lean" name="Massa Magra" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {loading && metrics.length === 0 && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
