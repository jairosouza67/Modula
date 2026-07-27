import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const authSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    name: z.string().optional(),
});

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setSession } = useAuthStore();

    const form = useForm<z.infer<typeof authSchema>>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
            name: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof authSchema>) => {
        setIsLoading(true);
        try {
            if (isSignUp) {
                // Validation for name in sign up
                if (!values.name || values.name.trim() === '') {
                    form.setError('name', { message: 'Nome é obrigatório para cadastro' });
                    setIsLoading(false);
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        data: {
                            name: values.name,
                        },
                    },
                });

                if (error) throw error;

                toast.success('Cadastro realizado com sucesso! Bem-vindo(a)!');
                if (data.session) {
                    setSession(data.session);
                    navigate('/');
                } else {
                    toast.info('Verifique seu e-mail para confirmar a conta.');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });

                if (error) throw error;

                toast.success('Logado com sucesso!');
                setSession(data.session);
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar autenticação');
        } finally {
            setIsLoading(false);
        }
    };


    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin,
                },
            });

            if (error) throw error;

            if (data?.url) {
                toast.info("Redirecionando para o Google...");
                window.location.href = data.url;
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao entrar com Google");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center space-y-2 mb-8 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_15px_rgba(255,107,53,0.3)] overflow-hidden">
                        <img src="/avatar-strong.png" alt="FireFit" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        FireFit <Sparkles className="w-5 h-5 text-primary" />
                    </h1>
                    <p className="text-muted-foreground">O espelho virtual do seu esforço real</p>
                </div>

                <div className="card-glassmorphism rounded-xl border border-border/50 p-6 shadow-2xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {isSignUp && (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome de Atleta</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Seu nome no jogo" className="bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input placeholder="guerreiro@firefit.com" type="email" className="bg-background" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha Secreta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="••••••••" type="password" className="bg-background" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                                {isLoading ? 'Forjando acesso...' : isSignUp ? 'Criar Personagem' : 'Entrar na Arena'}
                            </Button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/50" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full"
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Entrar com Google
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                form.reset();
                            }}
                            className="text-primary hover:text-primary/80 transition-colors font-medium"
                            type="button"
                        >
                            {isSignUp ? 'Já tem uma guilda? Entrar' : 'Novo no reino? Cadastre-se'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
