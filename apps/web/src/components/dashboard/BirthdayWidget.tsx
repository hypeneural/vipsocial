import { motion } from "framer-motion";
import { Cake, Award, Calendar, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BirthdayPerson {
  id: string;
  name: string;
  date: string;
  avatar?: string;
  type: "birthday" | "anniversary";
  years?: number;
}

const mockBirthdays: BirthdayPerson[] = [
  {
    id: "1",
    name: "Maria Santos",
    date: "Hoje",
    type: "birthday",
  },
  {
    id: "2",
    name: "Carlos Oliveira",
    date: "22 Jan",
    type: "anniversary",
    years: 5,
  },
  {
    id: "3",
    name: "Ana Costa",
    date: "25 Jan",
    type: "birthday",
  },
  {
    id: "4",
    name: "Pedro Almeida",
    date: "28 Jan",
    type: "anniversary",
    years: 2,
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export function BirthdayWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6 h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Cake className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold">Aniversariantes</h3>
          <p className="text-xs text-muted-foreground">Janeiro 2026</p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.1 } },
        }}
        className="space-y-2"
      >
        {mockBirthdays.map((person) => (
          <motion.div
            key={person.id}
            variants={itemVariants}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
              person.date === "Hoje"
                ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                : "hover:bg-muted/50"
            )}
          >
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage src={person.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-semibold">
                {person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{person.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {person.type === "birthday" ? (
                  <>
                    <Cake className="w-3 h-3" />
                    <span>Aniversário</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3 h-3" />
                    <span>{person.years} anos de casa</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span
                className={cn(
                  "text-xs font-semibold",
                  person.date === "Hoje" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {person.date}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5 rounded-xl">
        Ver todos
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
}
