import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Ticket, Tv, Shirt, Fuel, ShieldCheck, Trophy, Clock, ArrowRight, Menu, X, Upload, CheckCircle2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/mann-filter-logo.svg.asset.json";
import greenFabric from "@/assets/green-fabric.png.asset.json";
import productImg from "@/assets/mann-product.png.asset.json";
import confettiImg from "@/assets/confetti.png.asset.json";
import edmilsonImg from "@/assets/rivaldo.png.asset.json";
import ballImg from "@/assets/ball.png.asset.json";
import heroVideo from "@/assets/hero-bg.mov.asset.json";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Promoção MANN-FILTER · Peça Pelo Nome" },
      { name: "description", content: "Comprou MANN-FILTER? Cadastre sua nota fiscal até 31/07 e concorra a Smart TV, camisas e vale-combustível." },
      { property: "og:title", content: "Promoção MANN-FILTER · Peça Pelo Nome" },
      { property: "og:description", content: "Cada filtro MANN-FILTER gera 1 número da sorte." },
    ],
  }),
  component: Index,
});

const navLinks = [
  { label: "Como Participar", href: "#como-participar" },
  { label: "Prêmios", href: "#premios" },
  { label: "Regulamento", href: "#faq" },
];

function Index() {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const openModal = () => {
    setSuccess(null);
    setErrorMsg(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const nome = String(fd.get("nome") || "").trim();
      const cpf = String(fd.get("cpf") || "").trim();
      const whatsapp = String(fd.get("wpp") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const data_compra = String(fd.get("data") || "");
      const canal = String(fd.get("canal") || "");
      const numero_nf = String(fd.get("nf") || "").trim();
      const file = fd.get("upload") as File | null;

      if (!file || file.size === 0) {
        setErrorMsg("Anexe o arquivo da nota fiscal (PDF, JPG ou PNG).");
        return;
      }

      let arquivo_nf_url: string | null = null;
      const ext = file.name.split(".").pop() || "bin";
      const path = `${cpf.replace(/\D/g, "")}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("notas-fiscais")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      // Bucket is private; store the storage path. Admins generate signed URLs to view.
      arquivo_nf_url = path;

      const { data, error } = await supabase.rpc("registrar_participacao", {
        p_nome: nome,
        p_cpf: cpf,
        p_whatsapp: whatsapp,
        p_email: email,
        p_data_compra: data_compra,
        p_canal: canal,
        p_numero_nf: numero_nf,
        p_arquivo_nf_url: arquivo_nf_url ?? undefined,
      });

      if (error) {
        if (error.message?.includes("CPF_DUPLICADO")) {
          setErrorMsg("Este CPF já foi cadastrado na promoção.");
        } else {
          setErrorMsg("Ocorreu um erro ao registrar sua participação. Tente novamente.");
        }
        return;
      }

      const num = String(data ?? "").replace(/(\d{3})(\d{3})/, "$1 $2");

      // Notifica webhook externo (Make). Falhas não afetam o fluxo do usuário.
      try {
        await fetch("https://hook.us1.make.celonis.com/hoc4sikxnpoqh73unambcyyp0msxaflz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome,
            cpf,
            whatsapp,
            email,
            data_compra,
            canal,
            numero_nf,
            arquivo_nf_url,
            numero_sorte: String(data ?? ""),
          }),
        });
      } catch (webhookErr) {
        console.error("Webhook notification failed:", webhookErr);
      }

      setSuccess(num);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível enviar sua nota fiscal. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-40 bg-brand-green/60 backdrop-blur-md text-primary-foreground border-b border-brand-yellow/40 supports-[backdrop-filter]:bg-brand-green/45">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2">
            <img src={logo.url} alt="MANN-FILTER" className="h-9 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wider">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-brand-yellow transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button onClick={openModal} variant="hero" size="sm" className="hidden sm:inline-flex">
              Cadastrar nota <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <button
              className="md:hidden p-2"
              aria-label="Menu"
              onClick={() => setNavOpen((v) => !v)}
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {navOpen && (
          <div className="md:hidden border-t border-brand-yellow/30 bg-brand-green-dark">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-3 text-sm uppercase font-semibold">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <HeroSection openModal={openModal} />


      {/* PLACAR / URGENCY TICKER */}
      <section className="bg-brand-yellow text-brand-green-dark">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-3 gap-6 items-center">
          <Reveal dir="left" delay={0}><Stat icon={Clock} title="Até 31/07" sub="Período da promoção" /></Reveal>
          <Reveal dir="up" delay={120}><Stat icon={Ticket} title="1 nota = 1 número" sub="Receba na hora" /></Reveal>
          <Reveal dir="right" delay={240}><Stat icon={Trophy} title="TVs · Camisas · Combustível" sub="Prêmios em jogo" /></Reveal>
        </div>
      </section>

      {/* COMO PARTICIPAR */}
      <section id="como-participar" className="relative py-20 md:py-28 bg-background">
        {/* decorative ball top-right */}
        <img
          src={ballImg.url}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute -top-12 md:-top-16 right-4 md:right-10 w-20 md:w-28 z-20 animate-ball-bob drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
        />
        <div className="container mx-auto px-4">
          <Reveal dir="up">
            <SectionHeader
              eyebrow="Como participar"
              title="Três passos para entrar no jogo"
            />
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mt-12 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-green/0 via-brand-green/40 to-brand-green/0" />
            {[
              { n: "01", t: "Compre MANN-FILTER", d: "Peça pelo nome na oficina, loja ou online.", icon: Shirt },
              { n: "02", t: "Cadastre a nota fiscal", d: "Envie seus dados e a NF neste site.", icon: Upload },
              { n: "03", t: "Receba o número da sorte", d: "Pronto! Agora é só torcer pelos sorteios.", icon: Ticket },
            ].map((s, i) => (
              <StepCard key={s.n} index={i} step={s} />
            ))}
          </div>

          <Reveal dir="up" delay={150}>
            <div className="text-center mt-12">
              <Button onClick={openModal} variant="primary" size="xl">
                Cadastrar nota <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRÊMIOS */}
      <section id="premios" className="py-20 md:py-28 bg-field text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-pitch opacity-60" />
        <div className="container mx-auto px-4 relative">
          <Reveal dir="up">
            <SectionHeader
              eyebrow="Prêmios"
              title="Prêmios para quem entra no jogo"
              sub="Comprou, cadastrou, recebeu número — agora é só torcer."
              light
            />
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Reveal dir="left" delay={0}><PrizeCard icon={Tv} title="Smart TV 4K" desc="Imagem de campeão em qualquer partida." /></Reveal>
            <Reveal dir="up" delay={150}><PrizeCard icon={Shirt} title="Camisa de futebol" desc="Vista o clima da torcida." /></Reveal>
            <Reveal dir="right" delay={300}><PrizeCard icon={Fuel} title="Vale-combustível R$ 300" desc="Siga rodando com proteção MANN-FILTER." /></Reveal>
          </div>
          <Reveal dir="fade" delay={200}>
            <p className="text-center text-sm text-white/70 mt-8">
              Prêmios e datas de sorteio conforme regulamento.
            </p>
          </Reveal>
        </div>
      </section>

      {/* EDMILSON */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <Reveal dir="left">
            <ParallaxImage src={edmilsonImg.url} alt="Embaixador MANN-FILTER" />
          </Reveal>
          <div className="space-y-6">
            <Reveal dir="right" delay={0}>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-green">
                Prova de quem entende
              </span>
            </Reveal>
            <Reveal dir="right" delay={120}>
              <h2 className="font-display text-4xl md:text-5xl text-brand-green-dark leading-tight">
                Uma defesa forte te leva mais longe
              </h2>
            </Reveal>
            <Reveal dir="right" delay={240}>
              <blockquote className="text-xl md:text-2xl font-medium border-l-4 border-brand-yellow pl-6 italic text-foreground/80">
                "Quando a proteção faz seu trabalho, ninguém percebe — mas quando falha, todo mundo
                sente. No meu carro é MANN-FILTER, sempre."
              </blockquote>
            </Reveal>
            <Reveal dir="right" delay={360}>
              <p className="font-display text-lg text-brand-green-dark">— Edmílson</p>
            </Reveal>
            <Reveal dir="up" delay={480}>
              <Button onClick={openModal} variant="primary" size="lg">
                Peça pelo nome
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* POR QUE */}
      <section className="relative py-20 md:py-28 bg-field text-white overflow-hidden">
        <div className="absolute inset-0 bg-pitch opacity-60" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Copy — left */}
            <div className="space-y-7">
              <Reveal dir="left">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-yellow">
                  Por que MANN-FILTER
                </span>
                <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight text-white">
                  Proteção de verdade<br />para o seu motor
                </h2>
              </Reveal>

              <ul className="space-y-4">
                {[
                  "Proteção real para motor, óleo e combustível",
                  "Tecnologia alemã, +80 anos de estrada",
                  "Disponível nos principais pontos de venda",
                ].map((t, i) => (
                  <Reveal key={t} dir="left" delay={i * 140}>
                    <li className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-brand-green-dark" />
                      </div>
                      <span className="text-lg font-medium pt-1.5 text-white">{t}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Product image — right */}
            <Reveal dir="right" className="relative flex items-center justify-center">
              <img
                src={productImg.url}
                alt="Filtro MANN-FILTER"
                className="w-full max-w-none scale-150 md:scale-[1.7] lg:scale-[1.85] origin-center h-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)] animate-float md:mt-32 lg:mt-48"
              />
            </Reveal>
          </div>
        </div>
      </section>




      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Reveal dir="up">
            <SectionHeader eyebrow="FAQ" title="Perguntas frequentes" />
          </Reveal>
          <Accordion type="single" collapsible className="mt-10 rounded-2xl bg-gradient-to-br from-brand-green-dark via-brand-green-dark to-brand-green text-white p-2 md:p-4 shadow-lg">
            {[
              { q: "Como participar?", a: "Compre filtro MANN-FILTER, cadastre a NF e receba o número." },
              { q: "Qual o prazo?", a: "Compras até 31 de julho de 2026." },
              { q: "Posso cadastrar várias notas?", a: "Sim. Cada NF diferente gera um novo número da sorte." },
              { q: "Onde recebo o número?", a: "Na tela de sucesso e também por e-mail e WhatsApp." },
              { q: "Onde leio o regulamento?", a: "Disponível no link do rodapé desta página." },
            ].map((item, i) => (
              <Reveal key={i} dir="up" delay={i * 90}>
                <AccordionItem value={`item-${i}`} className="border-white/15 px-3 md:px-4">
                  <AccordionTrigger className="text-left text-lg font-semibold text-white hover:text-brand-yellow hover:no-underline [&[data-state=open]]:text-brand-yellow [&>svg]:text-brand-yellow">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-base text-white/80">{item.a}</AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-20 md:py-24 bg-brand-yellow border-y-4 border-brand-green-dark overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 80px, oklch(0.38 0.10 158 / 0.08) 80px 81px)",
          }}
        />
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <Reveal dir="scale">
            <h2 className="font-display text-brand-green-dark leading-tight">
              <span className="block whitespace-nowrap text-xl sm:text-2xl md:text-3xl">Na hora da troca, peça pelo nome.</span>
              <span className="block mt-3 md:mt-4 text-4xl sm:text-5xl md:text-7xl italic underline decoration-[6px] underline-offset-4 decoration-brand-green-dark">
                Peça MANN-FILTER.
              </span>
            </h2>
          </Reveal>
          <Reveal dir="up" delay={150}>
            <p className="mt-4 text-lg text-brand-green-dark/80">
              Cadastre sua nota agora e entre no jogo dos prêmios.
            </p>
          </Reveal>
          <Reveal dir="up" delay={300}>
            <Button onClick={openModal} variant="primary" size="xl" className="mt-8">
              Cadastrar nota <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-brand-green-dark text-white/80 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-6 items-center justify-between">
          <img src={logo.url} alt="MANN-FILTER" className="h-8 w-auto" />
          <p className="text-xs text-center max-w-3xl leading-relaxed">
            Promoção "Peça Pelo Nome" válida de 01/05 a 31/07/2026. Certificado de autorização
            SPA/ME nº XXXX/2026. Consulte condições, produtos participantes e datas de sorteio no
            regulamento.
          </p>
        </div>
      </footer>

      {/* FLOATING MOBILE CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-30">
        <Button onClick={openModal} variant="primary" size="xl" className="w-full shadow-2xl">
          Cadastrar nota <ArrowRight className="ml-1 h-5 w-5" />
        </Button>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {!success ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-brand-green-dark">
                  Cadastre sua nota fiscal
                </DialogTitle>
                <DialogDescription>
                  Participação sujeita à validação da NF conforme regulamento.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <Field id="nome" label="Nome completo" required />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="cpf" label="CPF" required placeholder="000.000.000-00" />
                  <Field id="wpp" label="WhatsApp" required placeholder="(00) 00000-0000" />
                </div>
                <Field id="email" label="E-mail" type="email" required />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="data" label="Data da compra" type="date" required />
                  <div className="space-y-1.5">
                    <Label htmlFor="canal">Canal</Label>
                    <select
                      id="canal"
                      name="canal"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Selecione</option>
                      <option>Oficina</option>
                      <option>Loja física</option>
                      <option>Online</option>
                    </select>
                  </div>
                </div>
                <Field id="nf" label="Nº da nota fiscal" required />
                <div className="space-y-1.5">
                  <Label htmlFor="upload">Upload da NF</Label>
                  <label
                    htmlFor="upload"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-brand-green transition-colors"
                  >
                    <Upload className="h-5 w-5 text-brand-green shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                      {fileName ?? "Clique para enviar (PDF, JPG, PNG)"}
                    </span>
                    <input
                      id="upload"
                      name="upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                    />
                  </label>
                </div>
                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox id="reg" required className="mt-0.5" />
                    <span>Li e aceito o regulamento da promoção.</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox id="lgpd" required className="mt-0.5" />
                    <span>Autorizo o uso dos meus dados conforme a LGPD.</span>
                  </label>
                </div>
                {errorMsg && (
                  <p className="text-sm text-destructive text-center" role="alert">{errorMsg}</p>
                )}
                <DialogFooter>
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Enviando..." : "Enviar e gerar número da sorte"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <div className="text-center py-6 space-y-5">
              <div className="mx-auto h-16 w-16 rounded-full bg-brand-yellow flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-brand-green-dark" />
              </div>
              <DialogTitle className="font-display text-3xl text-brand-green-dark">
                Cadastro concluído!
              </DialogTitle>
              <p className="text-muted-foreground">Seu número da sorte é</p>
              <div className="font-display text-5xl tracking-widest text-brand-green-dark bg-brand-yellow rounded-xl py-5">
                {success}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setSuccess(null)}
                >
                  Cadastrar outra nota
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href="#faq" onClick={() => setOpen(false)}>Ver regulamento</a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, title, sub }: { icon: typeof Tv; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 justify-center md:justify-start">
      <div className="h-12 w-12 rounded-full bg-brand-green-dark text-brand-yellow flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="font-display text-lg md:text-xl leading-tight">{title}</div>
        <div className="text-xs uppercase tracking-wider opacity-80">{sub}</div>
      </div>
    </div>
  );
}

type RevealDir = "up" | "down" | "left" | "right" | "scale" | "fade";
function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setM({
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      });
    };
    const leave = () => setM({ x: 0, y: 0 });
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <div className="animate-float w-full flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          width={1024}
          height={1280}
          loading="lazy"
          className="relative w-full max-w-md object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
          style={{
            transform: `translate3d(${m.x * 18}px, ${m.y * 14}px, 0) rotate(${m.x * 2.5}deg)`,
            transition: "transform 0.3s ease-out",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

function Reveal({
  children,
  dir = "up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  dir?: RevealDir;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hiddenMap: Record<RevealDir, string> = {
    up: "opacity-0 translate-y-12",
    down: "opacity-0 -translate-y-12",
    left: "opacity-0 -translate-x-16",
    right: "opacity-0 translate-x-16",
    scale: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  const shown = "opacity-100 translate-x-0 translate-y-0 scale-100";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? shown : hiddenMap[dir]
      } ${className}`}
    >
      {children}
    </div>
  );
}

function StepCard({
  index,
  step,
}: {
  index: number;
  step: { n: string; t: string; d: string; icon: typeof Tv };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Icon = step.icon;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Each card has its own entrance direction/effect
  const variants = [
    { hidden: "opacity-0 -translate-x-16 rotate-[-3deg]", shown: "opacity-100 translate-x-0 rotate-0" },
    { hidden: "opacity-0 translate-y-16 scale-95", shown: "opacity-100 translate-y-0 scale-100" },
    { hidden: "opacity-0 translate-x-16 rotate-[3deg]", shown: "opacity-100 translate-x-0 rotate-0" },
  ];
  const v = variants[index % variants.length];

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${index * 220}ms` : "0ms" }}
      className={`group relative p-8 rounded-2xl bg-card border border-border shadow-[0_8px_30px_-12px_rgba(2,125,80,0.18)] hover:shadow-[0_20px_40px_-15px_rgba(2,125,80,0.35)] transition-all duration-700 ease-out ${
        visible ? v.shown : v.hidden
      }`}
    >
      {/* number badge */}
      <div className="flex items-center justify-between">
        <span className="font-display text-7xl text-brand-green leading-none tracking-tight">
          {step.n}
        </span>
        <div className="h-12 w-12 rounded-xl bg-brand-yellow flex items-center justify-center shadow-sm">
          <Icon className="h-6 w-6 text-brand-green-dark" />
        </div>
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-brand-green/40 to-transparent" />
      <h3 className="font-display text-2xl mt-5 text-brand-green-dark">{step.t}</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{step.d}</p>
    </div>
  );
}


function HeroSection({ openModal }: { openModal: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      setMouse({ x, y });
    };
    const leave = () => setMouse({ x: 0, y: 0 });
    el.addEventListener("mousemove", handler);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", handler);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="top"
      className="relative overflow-hidden text-white bg-black min-h-screen flex items-center justify-center"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        src={heroVideo.url}
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative container mx-auto px-4 pt-40 pb-24 md:pt-48 md:pb-32 flex flex-col items-center text-center space-y-6 max-w-3xl">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow text-brand-green-dark text-xs font-bold uppercase tracking-widest shadow-md">
          <Trophy className="h-3.5 w-3.5" /> Promoção MANN-FILTER
        </span>
        <h1 className="font-display italic text-5xl sm:text-6xl md:text-7xl leading-[0.9] text-white">
          Peça pelo <span className="text-brand-yellow">nome</span>
        </h1>
        <p className="text-lg md:text-xl font-medium text-white max-w-xl">
          Comprou MANN-FILTER? Cadastre sua nota e concorra a prêmios.
          Até 31 de julho, cada filtro gera 1 número da sorte.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { icon: Tv, label: "Smart TV" },
            { icon: Shirt, label: "Camisa" },
            { icon: Fuel, label: "Vale R$ 300" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-medium shadow-sm"
            >
              <Icon className="h-4 w-4 text-brand-yellow" /> {label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2 justify-center">
          <Button onClick={openModal} variant="hero" size="xl">
            Cadastrar nota <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
          <Button asChild variant="outlineLight" size="xl">
            <a href="#como-participar">Ver como participar</a>
          </Button>
        </div>
        <p className="text-xs text-white/80 font-medium">Consulte o regulamento da promoção.</p>
      </div>
      <a
        href="#como-participar"
        aria-label="Role para baixo"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center justify-center text-white/70 hover:text-brand-yellow transition-colors animate-bounce z-10"
      >
        <ChevronDown className="h-6 w-6" strokeWidth={2.5} />
      </a>
    </section>



  );
}




function PrizeCard({ icon: Icon, title, desc }: { icon: typeof Tv; title: string; desc: string }) {
  return (
    <div className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/15 hover:border-brand-yellow hover:bg-white/10 transition-all">
      <div className="h-14 w-14 rounded-xl bg-brand-yellow text-brand-green-dark flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-2 text-white/80">{desc}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
  light,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  light?: boolean;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-xl"}>
      <span
        className={`text-xs font-bold uppercase tracking-widest ${
          light ? "text-brand-yellow" : "text-brand-green"
        }`}
      >
        {eyebrow}
      </span>
      <h2
        className={`font-display text-4xl md:text-5xl mt-3 leading-tight ${
          light ? "text-white" : "text-brand-green-dark"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-4 text-lg ${light ? "text-white/80" : "text-muted-foreground"}`}>{sub}</p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} name={id} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
