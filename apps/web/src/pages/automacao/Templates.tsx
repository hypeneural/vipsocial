import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Copy,
    Edit,
    Trash2,
    MoreVertical,
    FileText,
    Variable,
    Eye,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Template {
    id: string;
    name: string;
    category: string;
    content: string;
    variables: string[];
    usageCount: number;
    lastUsed: string;
    createdBy: string;
}

const mockTemplates: Template[] = [
    {
        id: "1",
        name: "Bom Dia VIP",
        category: "Rotina",
        content: "☀️ Bom dia, {{nome}}!\n\nConfira as principais notícias de hoje:\n\n{{manchetes}}\n\nAcesse: {{link}}",
        variables: ["nome", "manchetes", "link"],
        usageCount: 156,
        lastUsed: "Hoje, 07:00",
        createdBy: "Maria Santos",
    },
    {
        id: "2",
        name: "Alerta Urgente",
        category: "Urgente",
        content: "🚨 URGENTE!\n\n{{titulo}}\n\n{{resumo}}\n\nSaiba mais: {{link}}",
        variables: ["titulo", "resumo", "link"],
        usageCount: 42,
        lastUsed: "Ontem, 15:30",
        createdBy: "Carlos Oliveira",
    },
    {
        id: "3",
        name: "Resumo do Dia",
        category: "Rotina",
        content: "📰 Resumo do dia {{data}}\n\n{{noticias}}\n\n👋 Até amanhã!\n\nEquipe VIP Social",
        variables: ["data", "noticias"],
        usageCount: 89,
        lastUsed: "Hoje, 18:00",
        createdBy: "Ana Costa",
    },
    {
        id: "4",
        name: "Enquete",
        category: "Engajamento",
        content: "📊 Participe da nossa enquete!\n\n{{pergunta}}\n\n👉 Vote aqui: {{link_enquete}}\n\nSua opinião é importante!",
        variables: ["pergunta", "link_enquete"],
        usageCount: 23,
        lastUsed: "Há 3 dias",
        createdBy: "Pedro Almeida",
    },
    {
        id: "5",
        name: "Aniversário",
        category: "Institucional",
        content: "🎂 Parabéns, {{nome}}!\n\nHoje é seu dia especial. Desejamos muitas felicidades!\n\n🎉 Equipe VIP Social",
        variables: ["nome"],
        usageCount: 34,
        lastUsed: "Há 2 dias",
        createdBy: "Maria Santos",
    },
];

const categoryColors: Record<string, string> = {
    Rotina: "bg-info/15 text-info border-info/30",
    Urgente: "bg-destructive/15 text-destructive border-destructive/30",
    Engajamento: "bg-primary/15 text-primary border-primary/30",
    Institucional: "bg-success/15 text-success border-success/30",
};

const availableVariables = [
    { name: "nome", description: "Nome do destinatário" },
    { name: "data", description: "Data atual" },
    { name: "manchetes", description: "Lista de manchetes do dia" },
    { name: "link", description: "Link da notícia ou portal" },
    { name: "titulo", description: "Título da notícia" },
    { name: "resumo", description: "Resumo/lead da notícia" },
];

const Templates = () => {
    const [templates] = useState<Template[]>(mockTemplates);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [newTemplateContent, setNewTemplateContent] = useState("");

    const filteredTemplates = templates.filter((template) => {
        if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const insertVariable = (varName: string) => {
        setNewTemplateContent((prev) => prev + `{{${varName}}}`);
    };

    const highlightVariables = (content: string) => {
        return content.replace(/\{\{(\w+)\}\}/g, '<span class="template-variable">{{$1}}</span>');
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Templates de Mensagem</h1>
                        <p className="text-sm text-muted-foreground">
                            Crie e gerencie modelos com variáveis dinâmicas
                        </p>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Criar Template</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Template</Label>
                                        <Input placeholder="Ex: Bom Dia VIP" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Input placeholder="Ex: Rotina" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Variáveis Disponíveis</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableVariables.map((v) => (
                                            <Button
                                                key={v.name}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => insertVariable(v.name)}
                                            >
                                                <Variable className="w-3 h-3 mr-1" />
                                                {`{{${v.name}}}`}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Conteúdo</Label>
                                    <Textarea
                                        placeholder="Digite o conteúdo do template..."
                                        rows={6}
                                        value={newTemplateContent}
                                        onChange={(e) => setNewTemplateContent(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use {"{{variavel}}"} para inserir variáveis dinâmicas
                                    </p>
                                </div>

                                <Button className="w-full" onClick={() => setIsCreateDialogOpen(false)}>
                                    Criar Template
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <FileText className="w-4 h-4" />
                        Total Templates
                    </div>
                    <p className="text-2xl font-bold mt-1">{templates.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-primary/10 rounded-xl p-4 border border-primary/30"
                >
                    <div className="flex items-center gap-2 text-primary text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Usos Totais
                    </div>
                    <p className="text-2xl font-bold mt-1 text-primary">
                        {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-info/10 rounded-xl p-4 border border-info/30"
                >
                    <div className="flex items-center gap-2 text-info text-sm">
                        <Clock className="w-4 h-4" />
                        Mais Usado
                    </div>
                    <p className="text-lg font-bold mt-1 text-info truncate">Bom Dia VIP</p>
                </motion.div>
            </div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
            </motion.div>

            {/* Templates Grid */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="grid md:grid-cols-2 gap-4 pb-20 md:pb-0"
            >
                {filteredTemplates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-2xl border border-border/50 p-4 hover:shadow-md transition-all card-glow-primary"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold">{template.name}</h3>
                                <Badge
                                    className={cn(
                                        "text-[10px] rounded-full mt-1",
                                        categoryColors[template.category] || "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {template.category}
                                </Badge>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Preview */}
                        <div className="bg-muted/50 rounded-xl p-3 mb-3 text-sm">
                            <p
                                className="whitespace-pre-wrap line-clamp-4"
                                dangerouslySetInnerHTML={{ __html: highlightVariables(template.content) }}
                            />
                        </div>

                        {/* Variables */}
                        <div className="flex items-center gap-1 mb-3 flex-wrap">
                            <Variable className="w-3 h-3 text-muted-foreground" />
                            {template.variables.map((v) => (
                                <Badge key={v} variant="secondary" className="text-[10px] rounded-full font-mono">
                                    {`{{${v}}}`}
                                </Badge>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                            <span>{template.usageCount} usos</span>
                            <span>Último: {template.lastUsed}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-[#075E54] text-white rounded-2xl p-4 max-w-[80%]">
                            <p
                                className="whitespace-pre-wrap text-sm"
                                dangerouslySetInnerHTML={{
                                    __html: previewTemplate?.content
                                        .replace(/\{\{nome\}\}/g, '<span class="underline">João Silva</span>')
                                        .replace(/\{\{data\}\}/g, '<span class="underline">20/01/2026</span>')
                                        .replace(/\{\{titulo\}\}/g, '<span class="underline">Nova lei aprovada</span>')
                                        .replace(/\{\{link\}\}/g, '<span class="underline">vipsocial.com.br/123</span>')
                                        || "",
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Valores de exemplo para variáveis
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {filteredTemplates.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state"
                >
                    <FileText className="empty-state-icon" />
                    <p className="text-muted-foreground">Nenhum template encontrado</p>
                </motion.div>
            )}
        </AppShell>
    );
};

export default Templates;
