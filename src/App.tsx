import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code,
  Download,
  Terminal,
  Layers,
  Webhook,
  Lightbulb,
  CheckCircle,
  School,
  Eye as Visibility,
  ArrowDown as ArrowDownward,
  SlidersHorizontal as Tune,
  ArrowRight as ArrowForward,
  Building2 as Apartment,
  Fingerprint,
  Mail,
  Link as LinkIcon,
  Github,
  Copy,
  Check,
  Smartphone,
  Cpu,
  Layout,
  MessageSquare
} from 'lucide-react';

// --- Types ---
interface Profile {
  name: string;
  title: string;
  subtitle: string;
  pitch: string;
  email: string;
  linkedin: string;
  github: string;
  status: string;
}

interface Project {
  id: number;
  title: string;
  type: string;
  summary: string;
  problem: string;
  solution: string;
  stack: string[];
  highlights: string[];
  challenges: string[];
  architecture_diagram: string;
  links: { github?: string; web?: string };
}

// --- Fallback Data ---
const FALLBACK_PROFILE: Profile = {
  name: 'Manuel Cosovschi',
  title: 'Estudiante avanzado de Ingeniería en Sistemas',
  subtitle: 'Proyectos full-stack en producción.',
  pitch: 'Aprendí construyendo: Desde scripts de automatización hasta aplicaciones web completas durante la carrera. Capacidad para adaptarme a nuevas tecnologías (Node, React, Python) demostrada en proyectos académicos y prácticas. Busco mi primera experiencia formal con ganas de aportar valor desde el primer día y crecer profesionalmente.',
  email: 'manucosovschi@gmail.com',
  linkedin: 'linkedin.com/in/manuel-cosovschi',
  github: 'github.com/manuel-cosovschi',
  status: 'DISPONIBLE'
};

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'FitNow App',
    type: 'Tesis',
    summary: 'App iOS en SwiftUI con backend en Node.js/Express y MySQL. Módulo de recomendaciones en Python usando Ridge Regression.',
    problem: 'Falta de personalización en rutinas de entrenamiento y seguimiento eficiente de telemetría.',
    solution: 'Implementación de IA para sugerencias personalizadas y optimización de navegación GPS/batería.',
    stack: ['SwiftUI', 'NodeJS', 'MySQL', 'Python'],
    highlights: ['Navegación paso a paso', 'Telemetría'],
    challenges: ['Optimización de batería'],
    architecture_diagram: '',
    links: { github: 'https://github.com/manuel-cosovschi' }
  }
];

// --- Components ---

const StatusBadge = ({ online }: { online: boolean }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
    <div className={`size-1.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
    API {online ? 'ONLINE' : 'OFFLINE (FALLBACK)'}
  </div>
);

export default function App() {
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [isOnline, setIsOnline] = useState(false);
  const [viewMode, setViewMode] = useState<'executive' | 'technical'>('executive');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/projects')
        ]);

        if (profileRes.ok && projectsRes.ok) {
          const profileData = await profileRes.json();
          const projectsData = await projectsRes.json();
          setProfile(profileData);
          setProjects(projectsData);
          setIsOnline(true);
        }
      } catch (error) {
        console.error("API Error, using fallback:", error);
        setIsOnline(false);
      }
    };

    fetchData();
    logEvent('view_page', { page: 'home' });
  }, []);

  const logEvent = async (eventType: string, metadata: any = {}) => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, page: 'home', metadata })
      });
    } catch (e) { }
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(profile.pitch);
    setCopied(true);
    logEvent('copy_pitch');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCV = () => {
    logEvent('download_cv');
    const link = document.createElement('a');
    link.href = '/cv-manuel-cosovschi.pdf';
    link.download = 'CV - Manuel Cosovschi.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#020617] text-slate-100 font-sans min-h-screen selection:bg-sky-400 selection:text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-sky-400/20 flex items-center justify-center text-sky-400">
              <Code size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">{profile.name}</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Propuesta', 'Proyectos', 'Enfoque', 'ADN'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium hover:text-sky-400 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-[#0b1120] rounded-full p-1 border border-white/5">
              <button
                onClick={() => { setViewMode('executive'); logEvent('toggle_view', { mode: 'executive' }); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'executive' ? 'bg-sky-400 text-slate-900 shadow-lg shadow-sky-400/20' : 'text-slate-400 hover:text-white'}`}
              >
                Vista Ejecutiva
              </button>
              <button
                onClick={() => { setViewMode('technical'); logEvent('toggle_view', { mode: 'technical' }); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'technical' ? 'bg-sky-400 text-slate-900 shadow-lg shadow-sky-400/20' : 'text-slate-400 hover:text-white'}`}
              >
                Detalle Técnico
              </button>
            </div>
            <button
              onClick={handleDownloadCV}
              className="bg-sky-400 hover:bg-sky-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
            >
              <Download size={18} />
              <span className="hidden sm:inline">CV</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Status Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#0b1120]/90 backdrop-blur-sm border-b border-white/5 py-2">
        <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between text-[10px] font-mono text-sky-400/80">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="animate-pulse" />
            <span>ESTADO: {profile.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge online={isOnline} />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-[#0f172a] rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-sky-400 w-[97%]" />
              </div>
              <span>INGENIERÍA 97% — 41/42 + tesis</span>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[1100px] mx-auto space-y-24">

          {/* Hero Section */}
          <section className="relative min-h-[500px] flex flex-col justify-end pb-12 rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070"
                alt="Tech Background"
                className="w-full h-full object-cover opacity-30 mix-blend-overlay grayscale contrast-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 px-8 md:px-12"
            >
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { icon: Layers, text: 'Proyectos full-stack end-to-end' },
                  { icon: Webhook, text: 'Automatizaciones con n8n/Netlify' },
                  { icon: Lightbulb, text: 'Mentalidad de producto' }
                ].map((badge, i) => (
                  <span key={i} className="bg-sky-400/10 border border-sky-400/20 text-sky-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <badge.icon size={12} /> {badge.text}
                  </span>
                ))}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
                {profile.name.split(' ')[0]} <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">{profile.name.split(' ')[1]}</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light mb-8 leading-relaxed">
                {profile.title} | {profile.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#propuesta" className="bg-sky-400 hover:bg-sky-500 text-slate-900 px-8 py-3.5 rounded-lg text-base font-bold transition-all shadow-lg shadow-sky-400/20 flex items-center gap-2">
                  Ver Propuesta <ArrowDownward size={20} />
                </a>
                <button
                  onClick={() => { setViewMode(viewMode === 'executive' ? 'technical' : 'executive'); logEvent('toggle_view', { mode: viewMode === 'executive' ? 'technical' : 'executive' }); }}
                  className="bg-[#0f172a] border border-white/10 hover:bg-[#0f172a]/80 text-white px-8 py-3.5 rounded-lg text-base font-bold transition-all flex items-center gap-2"
                >
                  {viewMode === 'executive' ? 'Vista Técnica' : 'Vista Ejecutiva'} <Tune size={20} />
                </button>
              </div>
            </motion.div>
          </section>

          {/* Pitch Section */}
          <section id="propuesta" style={{ scrollMarginTop: '120px' }} className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-3xl font-bold text-white mb-2">La Propuesta</h2>
              <p className="text-slate-400">Por qué busco sumarme a Naranja X.</p>
            </div>
            <div className="md:col-span-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="bg-[#0f172a] rounded-xl p-8 border border-white/5 relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <School size={120} className="text-white" />
                </div>
                <ul className="space-y-6 relative z-10">
                  {profile.pitch.split('. ').map((sentence, i) => (
                    sentence && (
                      <li key={i} className="flex items-start gap-4">
                        <CheckCircle size={24} className="text-sky-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 text-lg leading-snug">{sentence}.</span>
                      </li>
                    )
                  ))}
                </ul>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleCopyPitch}
                    className="text-sky-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado' : 'Copiar Resumen'}
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Projects Section */}
          <section id="proyectos" style={{ scrollMarginTop: '120px' }}>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Proyectos Destacados</h2>
                <p className="text-slate-400">Desafíos académicos, tesis y prácticas.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-[#0b1120] px-3 py-1.5 rounded-lg border border-white/5">
                <Visibility size={14} className="text-sky-400" />
                <span>Visualizando en Vista {viewMode === 'executive' ? 'Ejecutiva' : 'Técnica'}</span>
              </div>
            </div>

            <div className="space-y-12">
              {projects.map((project, idx) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className={`bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5 flex flex-col ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} group hover:border-sky-400/30 transition-all duration-500 shadow-xl`}
                >
                  <div className="lg:w-1/2 relative min-h-[350px] bg-[#0b1120] overflow-hidden">
                    <img
                      src={project.architecture_diagram || `https://picsum.photos/seed/${project.id}/800/600`}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal scale-105 group-hover:scale-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90`} />
                  </div>

                  <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors">{project.title}</h3>
                      <span className="bg-sky-400/10 text-sky-400 border border-sky-400/20 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                        {project.type}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {viewMode === 'executive' ? (
                        <motion.div
                          key="exec"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6 flex-grow"
                        >
                          <p className="text-slate-300 leading-relaxed text-lg">{project.summary}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0b1120] p-4 rounded-lg border border-white/5">
                              <p className="text-sky-400 text-[10px] font-bold uppercase mb-2">Problema</p>
                              <p className="text-slate-400 text-sm leading-snug">{project.problem}</p>
                            </div>
                            <div className="bg-[#0b1120] p-4 rounded-lg border border-white/5">
                              <p className="text-sky-400 text-[10px] font-bold uppercase mb-2">Solución</p>
                              <p className="text-slate-400 text-sm leading-snug">{project.solution}</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="tech"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-6 flex-grow"
                        >
                          <div>
                            <p className="text-sky-400 text-[10px] font-bold uppercase mb-3">Highlights Técnicos</p>
                            <ul className="grid grid-cols-1 gap-2">
                              {project.highlights.map((h, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                                  <div className="size-1 rounded-full bg-sky-400" /> {h}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sky-400 text-[10px] font-bold uppercase mb-3">Desafíos Vencidos</p>
                            <ul className="grid grid-cols-1 gap-2">
                              {project.challenges.map((c, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-400 text-sm italic">
                                  <div className="size-1 rounded-full bg-slate-600" /> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                      <div className="flex -space-x-2">
                        {project.stack.map((tech, i) => (
                          <div
                            key={i}
                            className="size-9 rounded-full bg-[#0b1120] border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold text-white shadow-xl"
                            title={tech}
                          >
                            {tech.substring(0, 2)}
                          </div>
                        ))}
                      </div>
                      <a
                        href={project.links.github || project.links.web || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => logEvent('open_project', { id: project.id })}
                        className="text-white hover:text-sky-400 font-bold text-sm flex items-center gap-2 transition-all group/btn"
                      >
                        Ver en GitHub
                        <ArrowForward size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          {/* Impact Section */}
          <section id="enfoque" style={{ scrollMarginTop: '120px' }} className="bg-gradient-to-br from-[#0f172a] to-[#0b1120] rounded-2xl p-1 border border-white/10 shadow-2xl">
            <div className="bg-[#020617]/80 backdrop-blur-3xl rounded-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-3">Cómo Trabajo</h2>
                <p className="text-slate-400">Mi enfoque para resolver problemas técnicos.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Smartphone, title: 'Optimización', desc: 'Itero continuamente para mejorar rendimiento y experiencia de usuario.' },
                  { icon: Cpu, title: 'Escalabilidad', desc: 'Diseño arquitecturas robustas pensando en el crecimiento desde el día uno.' },
                  { icon: Layout, title: 'UX / UI', desc: 'Construyo interfaces intuitivas priorizando la usabilidad y la claridad.' }
                ].map((card, i) => (
                  <div
                    key={i}
                    className="p-8 rounded-xl text-center border border-white/5 bg-[#0f172a] hover:border-sky-400/30 transition-all group"
                  >
                    <div className="size-14 rounded-full flex items-center justify-center mx-auto mb-6 bg-sky-400/10 text-sky-400 group-hover:bg-sky-400 group-hover:text-slate-900 transition-all">
                      <card.icon size={28} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3">{card.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: '01', title: 'Entender', text: 'Analizo el problema y detecto los puntos de fricción reales.' },
                  { step: '02', title: 'Prototipar', text: 'Construyo rápido para validar la solución antes de invertir tiempo.' },
                  { step: '03', title: 'Iterar', text: 'Refactorizo y pruebo hasta lograr consistencia y calidad.' }
                ].map((item, i) => (
                  <div key={i} className="bg-[#0b1120] rounded-xl p-6 border border-white/5">
                    <span className="text-sky-400 text-3xl font-black block mb-3">{item.step}</span>
                    <h4 className="text-white font-bold mb-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DNA Section */}
          <section id="adn" style={{ scrollMarginTop: '120px' }}>
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-white">El ADN</h2>
              <Fingerprint size={40} className="text-slate-700" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: '01', title: 'Curiosidad', text: 'Siempre preguntando "por qué" antes de "cómo". Entendiendo el problema central.' },
                { id: '02', title: 'Resiliencia', text: 'Los bugs son oportunidades de aprendizaje. Persistencia hasta encontrar la solución.' },
                { id: '03', title: 'Empatía', text: 'Construyendo para humanos. La experiencia de usuario es clave en cada desarrollo.' },
                { id: '04', title: 'Crecimiento', text: 'Mentalidad de estudiante permanente. Buscando mejorar con cada línea de código.' }
              ].map((item) => (
                <div key={item.id} className="bg-[#0f172a] p-8 rounded-xl border border-white/5 hover:border-sky-400/30 transition-all group">
                  <span className="text-5xl font-black text-slate-800 mb-6 block group-hover:text-sky-400/20 transition-colors">{item.id}</span>
                  <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b1120] border-t border-white/5 py-20 px-6">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">¿Conectamos?</h2>
            <div className="flex flex-col gap-6">
              {[
                { icon: Mail, text: 'manucosovschi@gmail.com', href: 'mailto:manucosovschi@gmail.com' },
                { icon: LinkIcon, text: 'linkedin.com/in/manuel-cosovschi', href: 'https://linkedin.com/in/manuel-cosovschi' },
                { icon: Github, text: 'github.com/manuel-cosovschi', href: 'https://github.com/manuel-cosovschi' }
              ].map((link, i) => (
                <a key={i} href={link.href} className="flex items-center gap-4 text-slate-300 hover:text-sky-400 transition-all group">
                  <div className="size-12 rounded-full bg-[#0f172a] flex items-center justify-center border border-white/10 group-hover:border-sky-400/50 group-hover:bg-sky-400/10 transition-all">
                    <link.icon size={20} />
                  </div>
                  <span className="text-lg font-medium">{link.text}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between items-start md:items-end">
            <div className="text-right hidden md:block">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Estado Actual</p>
              <div className="flex items-center gap-3 justify-end">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400" />
                </span>
                <span className="text-white font-bold text-lg">Buscando Primera Experiencia</span>
              </div>
            </div>

            <div className="w-full md:w-auto mt-12 md:mt-0">
              <a
                href="mailto:manucosovschi@gmail.com?subject=Contacto desde Portfolio"
                onClick={() => logEvent('click_contact')}
                className="block w-full md:w-auto text-center bg-sky-400 hover:bg-sky-500 text-slate-900 px-10 py-5 rounded-xl text-lg font-bold shadow-2xl shadow-sky-400/20 transition-all active:scale-95"
              >
                Contactame
              </a>
              <p className="text-center md:text-right text-[10px] font-mono text-slate-600 mt-6 uppercase tracking-widest">
                © {new Date().getFullYear()} {profile.name}. Portfolio Académico Profesional.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
