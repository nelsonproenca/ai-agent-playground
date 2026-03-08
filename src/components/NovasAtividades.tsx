import { Bot, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const COMANDOS = [
  { comando: "#Cadastro", descricao: "Cadastro de Atividade" },
  { comando: "#Listagem", descricao: "Listar de Atividades do Dia" },
  { comando: "#Finalizar", descricao: "Finalizar uma Atividade" },
  { comando: "#MenuListar", descricao: "Menu de Listar de Atividade" },
  { comando: "#Sair", descricao: "Mensagem de Saída" },
  { comando: "#Fechadas", descricao: "Listar de Atividades Fechadas" },
  { comando: "#Abertas", descricao: "Listar de Atividades Abertas" },
  { comando: "#Todas", descricao: "Listar Todas as Atividades" },
  { comando: "UUID (ID)", descricao: "Finalizar a atividade específica" },
];

const NovasAtividades = () => {
  return (
    <section className="mt-20">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm font-mono text-accent-foreground">
          <Bot className="h-4 w-4 text-accent" />
          Novas Atividades
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Agente de IA: <span className="text-gradient-primary">Ajudante de Cadastro</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Este novo item possui um agente de IA integrado que funciona como um ajudante inteligente
          para realizar o cadastro e a gestão de atividades diretamente via comandos.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Tabela de Comandos */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">comandos_agente.sh</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Envie um destes comandos no chat do Telegram para interagir com o bot.
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Comando</TableHead>
                  <TableHead>Função</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMANDOS.map((item) => (
                  <TableRow key={item.comando}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {item.comando}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Card Telegram */}
        <div className="rounded-xl border border-primary/30 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 shrink-0">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="font-mono font-bold text-foreground text-lg">
                Acesse o Bot no Telegram
              </h3>
              <p className="text-sm text-muted-foreground">
                Bot: <span className="font-semibold text-foreground">AtividadesSiteNPIBot</span> — 
                Inicie uma conversa e envie os comandos acima para gerenciar suas atividades.
              </p>
            </div>
            <Button asChild className="font-mono gap-2 shrink-0">
              <a href="https://t.me/AtividadesSiteNPIBot" target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4" />
                Abrir Telegram
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NovasAtividades;
