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
  MessageSquare,
  Zap,
  Flame,
  Rocket,
  Heart,
  Users,
  Target,
  MapPin,
  Calendar,
  Clock,
  Sparkles
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

// --- NX Mode Content ---
const NX_PITCH_ITEMS = [
  'Construí soluciones completas de punta a punta — apps móviles, APIs, bots, dashboards — con la misma mentalidad de producto que mueve a NX.',
  'Cada proyecto que armé nació de un problema real: automatizar reservas, personalizar entrenamientos con IA, digitalizar procesos manuales. Eso es pensar "De Corazón" desde lo técnico.',
  'Aprendí haciendo, no memorizando. Eso es exactamente lo que Talento Flux pide: learning by doing, agilidad para aprender, y hambre de crecer.',
  'No busco solo mi primera experiencia — busco el equipo justo donde aportar desde el día uno y evolucionar juntos.'
];

const NX_PROJECT_REFRAMES = [
  { nxAngle: 'AI & Personalización', nxWhy: 'Apliqué Machine Learning (Ridge Regression) para personalizar experiencias. NX usa ML para modelos de riesgo y scoring — la mentalidad AI First no me es ajena.' },
  { nxAngle: 'Producto Digital', nxWhy: 'Diseñé un flujo de reservas de punta a punta, validando disponibilidad en tiempo real. Experiencia directa en UX para servicios que la gente usa todos los días.' },
  { nxAngle: 'Automatización', nxWhy: 'Automaticé comunicación y procesos con bots y n8n. En una fintech como NX, automatizar significa escalar sin perder calidad de servicio.' },
  { nxAngle: 'Full-Stack Empresarial', nxWhy: 'Desarrollé un sistema de gestión con Angular y .NET para datos reales de clientes. Experiencia manejando lógica de negocio compleja como la que maneja NX.' }
];

const NX_DNA = [
  { id: '01', title: 'Learning Agility', text: 'Cada proyecto fue con un stack diferente. SwiftUI, React, Angular, Python, n8n — aprendí lo que necesitaba, cuando lo necesitaba. Sin excusas.' },
  { id: '02', title: 'Builder Mindset', text: 'No espero a que me asignen tareas. Identifiqué problemas reales y construí soluciones completas. Esa proactividad es lo que mueve a los Fluxers.' },
  { id: '03', title: 'De Corazón', text: 'Cada línea de código que escribo tiene un usuario detrás. La empatía con el usuario final es lo que diferencia un producto bueno de uno que la gente realmente elige.' },
  { id: '04', title: 'Mentalidad AI First', text: 'Desde Ridge Regression hasta automatizaciones inteligentes: la IA no es un buzzword para mí, es una herramienta real que ya integré en proyectos.' }
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
  const [nxMode, setNxMode] = useState(false);

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
    const textToCopy = nxMode ? NX_PITCH_ITEMS.join(' ') : profile.pitch;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    logEvent('copy_pitch', { nxMode });
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

  const toggleNxMode = () => {
    setNxMode(!nxMode);
    logEvent('toggle_nx_mode', { active: !nxMode });
    if (!nxMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dynamic color helpers
  const accent = nxMode ? 'orange' : 'sky';
  const accentClass = nxMode ? 'text-orange-400' : 'text-sky-400';
  const accentBg = nxMode ? 'bg-orange-500' : 'bg-sky-400';
  const accentBgHover = nxMode ? 'hover:bg-orange-600' : 'hover:bg-sky-500';
  const accentBgLight = nxMode ? 'bg-orange-500/10' : 'bg-sky-400/10';
  const accentBorder = nxMode ? 'border-orange-500/20' : 'border-sky-400/20';
  const accentHoverBorder = nxMode ? 'hover:border-orange-500/30' : 'hover:border-sky-400/30';
  const accentShadow = nxMode ? 'shadow-orange-500/20' : 'shadow-sky-400/20';
  const accentGradient = nxMode ? 'from-orange-400 to-red-500' : 'from-sky-400 to-indigo-400';
  const selectionClass = nxMode ? 'selection:bg-orange-400 selection:text-white' : 'selection:bg-sky-400 selection:text-slate-900';

  return (
    <div className={`bg-[#020617] text-slate-100 font-sans min-h-screen ${selectionClass} transition-colors duration-700`}>

      {/* Floating NX Mode Button */}
      <motion.button
        onClick={toggleNxMode}
        className={`fixed bottom-8 right-8 z-[60] px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-2xl transition-all duration-500 ${nxMode
            ? 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30'
          }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        {nxMode ? (
          <><Code size={18} /> Volver al Portfolio</>
        ) : (
          <><Flame size={18} /> Activar Modo NX</>
        )}
      </motion.button>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00]/80 border-orange-500/10' : 'bg-[#0f172a]/70 border-white/5'}`}>
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-lg flex items-center justify-center transition-colors duration-700 ${nxMode ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-400/20 text-sky-400'}`}>
              {nxMode ? <Flame size={18} /> : <Code size={18} />}
            </div>
            <span className="font-bold text-lg tracking-tight">
              {nxMode ? 'Manuel × NX' : profile.name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {(nxMode ? ['Propuesta', 'Proyectos', 'Enfoque', 'ADN'] : ['Propuesta', 'Proyectos', 'Enfoque', 'ADN']).map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm font-medium transition-colors ${nxMode ? 'hover:text-orange-400' : 'hover:text-sky-400'}`}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex rounded-full p-1 border transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00] border-orange-500/10' : 'bg-[#0b1120] border-white/5'}`}>
              <button
                onClick={() => { setViewMode('executive'); logEvent('toggle_view', { mode: 'executive' }); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'executive' ? `${accentBg} text-slate-900 shadow-lg ${accentShadow}` : 'text-slate-400 hover:text-white'}`}
              >
                Vista Ejecutiva
              </button>
              <button
                onClick={() => { setViewMode('technical'); logEvent('toggle_view', { mode: 'technical' }); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'technical' ? `${accentBg} text-slate-900 shadow-lg ${accentShadow}` : 'text-slate-400 hover:text-white'}`}
              >
                Detalle Técnico
              </button>
            </div>
            <button
              onClick={handleDownloadCV}
              className={`${accentBg} ${accentBgHover} text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2`}
            >
              <Download size={18} />
              <span className="hidden sm:inline">CV</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Status Bar */}
      <div className={`fixed top-16 left-0 right-0 z-40 backdrop-blur-sm border-b py-2 transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00]/90 border-orange-500/10' : 'bg-[#0b1120]/90 border-white/5'}`}>
        <div className={`max-w-[1100px] mx-auto px-6 flex items-center justify-between text-[10px] font-mono transition-colors duration-700 ${nxMode ? 'text-orange-400/80' : 'text-sky-400/80'}`}>
          <div className="flex items-center gap-2">
            {nxMode ? <Flame size={12} className="animate-pulse" /> : <Terminal size={12} className="animate-pulse" />}
            <span>{nxMode ? 'MODO NX ACTIVADO — TALENTO FLUX 5TA EDICIÓN' : `ESTADO: ${profile.status}`}</span>
          </div>
          <div className="flex items-center gap-4">
            {nxMode ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={12} />
                  <span>VIERNES 6/3</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>8:30 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} />
                  <span>PLAZA GALICIA, LEIVA 4070 P.8</span>
                </div>
              </div>
            ) : (
              <>
                <StatusBadge online={isOnline} />
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-[#0f172a] rounded-full overflow-hidden border border-white/10">
                    <div className={`h-full w-[97%] transition-colors duration-700 ${nxMode ? 'bg-orange-500' : 'bg-sky-400'}`} />
                  </div>
                  <span>INGENIERÍA 97% — 41/42 + tesis</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[1100px] mx-auto space-y-24">

          {/* Hero Section */}
          <AnimatePresence mode="wait">
            <motion.section
              key={nxMode ? 'nx-hero' : 'default-hero'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative min-h-[500px] flex flex-col justify-end pb-12 rounded-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 z-0">
                <img
                  src={nxMode
                    ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2070'
                    : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070'
                  }
                  alt="Background"
                  className={`w-full h-full object-cover opacity-30 mix-blend-overlay contrast-125 transition-all duration-700 ${nxMode ? 'grayscale-0 hue-rotate-15' : 'grayscale'}`}
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 transition-colors duration-700 ${nxMode ? 'bg-gradient-to-t from-[#020617] via-[#020617]/80 to-orange-950/20' : 'bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent'}`} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 px-8 md:px-12"
              >
                <div className="flex flex-wrap gap-3 mb-6">
                  {(nxMode ? [
                    { icon: Flame, text: 'Talento Flux — 5ta Edición' },
                    { icon: Rocket, text: 'AI First Mindset' },
                    { icon: Heart, text: 'De Corazón' }
                  ] : [
                    { icon: Layers, text: 'Proyectos full-stack end-to-end' },
                    { icon: Webhook, text: 'Automatizaciones con n8n/Netlify' },
                    { icon: Lightbulb, text: 'Mentalidad de producto' }
                  ]).map((badge, i) => (
                    <span key={i} className={`${accentBgLight} border ${accentBorder} ${accentClass} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-700`}>
                      <badge.icon size={12} /> {badge.text}
                    </span>
                  ))}
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
                  {nxMode ? (
                    <>Manuel <span className={`bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>× Naranja X</span></>
                  ) : (
                    <>{profile.name.split(' ')[0]} <span className={`bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>{profile.name.split(' ')[1]}</span></>
                  )}
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light mb-8 leading-relaxed">
                  {nxMode
                    ? 'Construí 4 productos reales antes de recibirme. Ahora quiero construir el futuro financiero con el equipo de NX.'
                    : `${profile.title} | ${profile.subtitle}`
                  }
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#propuesta" className={`${accentBg} ${accentBgHover} text-slate-900 px-8 py-3.5 rounded-lg text-base font-bold transition-all shadow-lg ${accentShadow} flex items-center gap-2`}>
                    {nxMode ? 'Por qué NX' : 'Ver Propuesta'} <ArrowDownward size={20} />
                  </a>
                  <button
                    onClick={() => { setViewMode(viewMode === 'executive' ? 'technical' : 'executive'); logEvent('toggle_view', { mode: viewMode === 'executive' ? 'technical' : 'executive' }); }}
                    className={`border hover:bg-white/5 text-white px-8 py-3.5 rounded-lg text-base font-bold transition-all flex items-center gap-2 ${nxMode ? 'bg-[#1a0a00] border-orange-500/20' : 'bg-[#0f172a] border-white/10'}`}
                  >
                    {viewMode === 'executive' ? 'Vista Técnica' : 'Vista Ejecutiva'} <Tune size={20} />
                  </button>
                </div>
              </motion.div>
            </motion.section>
          </AnimatePresence>

          {/* Pitch / Why NX Section */}
          <section id="propuesta" style={{ scrollMarginTop: '120px' }} className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-3xl font-bold text-white mb-2">
                {nxMode ? 'Por qué NX' : 'La Propuesta'}
              </h2>
              <p className="text-slate-400">
                {nxMode ? 'Lo que traigo al equipo y por qué elijo NX.' : 'Por qué busco sumarme a Naranja X.'}
              </p>
            </div>
            <div className="md:col-span-8">
              <motion.div
                key={nxMode ? 'nx-pitch' : 'default-pitch'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-xl p-8 border relative overflow-hidden shadow-2xl transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00] border-orange-500/10' : 'bg-[#0f172a] border-white/5'}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  {nxMode ? <Flame size={120} className="text-orange-400" /> : <School size={120} className="text-white" />}
                </div>
                <ul className="space-y-6 relative z-10">
                  {(nxMode ? NX_PITCH_ITEMS : profile.pitch.split('. ')).map((sentence, i) => (
                    sentence && (
                      <li key={i} className="flex items-start gap-4">
                        <CheckCircle size={24} className={`${accentClass} shrink-0 mt-0.5 transition-colors duration-700`} />
                        <span className="text-slate-200 text-lg leading-snug">{nxMode ? sentence : `${sentence}.`}</span>
                      </li>
                    )
                  ))}
                </ul>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleCopyPitch}
                    className={`${accentClass} hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors`}
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
                <h2 className="text-3xl font-bold text-white mb-2">
                  {nxMode ? 'Lo que construí y lo que aporto' : 'Proyectos Destacados'}
                </h2>
                <p className="text-slate-400">
                  {nxMode ? 'Cada proyecto demuestra una capacidad que NX necesita.' : 'Desafíos académicos, tesis y prácticas.'}
                </p>
              </div>
              <div className={`hidden md:flex items-center gap-2 text-xs text-slate-500 px-3 py-1.5 rounded-lg border transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00] border-orange-500/10' : 'bg-[#0b1120] border-white/5'}`}>
                <Visibility size={14} className={accentClass} />
                <span>Visualizando en Vista {viewMode === 'executive' ? 'Ejecutiva' : 'Técnica'}</span>
              </div>
            </div>

            <div className="space-y-12">
              {projects.map((project, idx) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl overflow-hidden border flex flex-col ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} group transition-all duration-500 shadow-xl ${nxMode ? 'bg-[#1a0a00] border-orange-500/10 hover:border-orange-500/30' : 'bg-[#0f172a] border-white/5 hover:border-sky-400/30'
                    }`}
                >
                  <div className={`lg:w-1/2 relative min-h-[350px] overflow-hidden ${nxMode ? 'bg-[#120800]' : 'bg-[#0b1120]'}`}>
                    <img
                      src={project.architecture_diagram || `https://picsum.photos/seed/${project.id}/800/600`}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal scale-105 group-hover:scale-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-90 ${nxMode ? 'from-[#1a0a00]' : 'from-[#0f172a]'}`} />

                    {/* NX Angle Badge overlaid on image */}
                    {nxMode && NX_PROJECT_REFRAMES[idx] && (
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <span className="bg-orange-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                          <Target size={12} /> {NX_PROJECT_REFRAMES[idx].nxAngle}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-2xl font-bold text-white transition-colors ${nxMode ? 'group-hover:text-orange-400' : 'group-hover:text-sky-400'}`}>{project.title}</h3>
                      <span className={`${accentBgLight} ${accentClass} border ${accentBorder} px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors duration-700`}>
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

                          {nxMode && NX_PROJECT_REFRAMES[idx] ? (
                            <div className={`p-4 rounded-lg border ${nxMode ? 'bg-[#120800] border-orange-500/10' : 'bg-[#0b1120] border-white/5'}`}>
                              <p className={`${accentClass} text-[10px] font-bold uppercase mb-2`}>Relevancia para NX</p>
                              <p className="text-slate-300 text-sm leading-snug">{NX_PROJECT_REFRAMES[idx].nxWhy}</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#0b1120] p-4 rounded-lg border border-white/5">
                                <p className={`${accentClass} text-[10px] font-bold uppercase mb-2`}>Problema</p>
                                <p className="text-slate-400 text-sm leading-snug">{project.problem}</p>
                              </div>
                              <div className="bg-[#0b1120] p-4 rounded-lg border border-white/5">
                                <p className={`${accentClass} text-[10px] font-bold uppercase mb-2`}>Solución</p>
                                <p className="text-slate-400 text-sm leading-snug">{project.solution}</p>
                              </div>
                            </div>
                          )}
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
                            <p className={`${accentClass} text-[10px] font-bold uppercase mb-3`}>Highlights Técnicos</p>
                            <ul className="grid grid-cols-1 gap-2">
                              {project.highlights.map((h, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                                  <div className={`size-1 rounded-full transition-colors duration-700 ${nxMode ? 'bg-orange-400' : 'bg-sky-400'}`} /> {h}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className={`${accentClass} text-[10px] font-bold uppercase mb-3`}>Desafíos Vencidos</p>
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
                            className={`size-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white shadow-xl transition-colors duration-700 ${nxMode ? 'bg-[#120800] border-[#1a0a00]' : 'bg-[#0b1120] border-[#0f172a]'}`}
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
                        className={`text-white font-bold text-sm flex items-center gap-2 transition-all group/btn ${nxMode ? 'hover:text-orange-400' : 'hover:text-sky-400'}`}
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

          {/* How I Work / NX Culture Fit Section */}
          <section id="enfoque" style={{ scrollMarginTop: '120px' }} className={`bg-gradient-to-br rounded-2xl p-1 border shadow-2xl transition-colors duration-700 ${nxMode ? 'from-[#1a0a00] to-[#120800] border-orange-500/10' : 'from-[#0f172a] to-[#0b1120] border-white/10'}`}>
            <div className="bg-[#020617]/80 backdrop-blur-3xl rounded-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-3">
                  {nxMode ? 'Mi cultura es la de NX' : 'Cómo Trabajo'}
                </h2>
                <p className="text-slate-400">
                  {nxMode ? 'Los valores que me mueven son los mismos que mueven a Naranja X.' : 'Mi enfoque para resolver problemas técnicos.'}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {(nxMode ? [
                  { icon: Heart, title: 'De Corazón', desc: 'Construyo pensando en las personas. Cada producto que hice arrancó entendiendo al usuario, no la tecnología.' },
                  { icon: Zap, title: 'Learning by Doing', desc: 'No espero a saber todo para arrancar. SwiftUI, n8n, React — aprendí cada stack construyendo algo real con él.' },
                  { icon: Users, title: 'Equipo Primero', desc: 'Los mejores resultados los logré colaborando. La tesis, las prácticas, los bots: todo fue trabajo colectivo.' }
                ] : [
                  { icon: Smartphone, title: 'Optimización', desc: 'Itero continuamente para mejorar rendimiento y experiencia de usuario.' },
                  { icon: Cpu, title: 'Escalabilidad', desc: 'Diseño arquitecturas robustas pensando en el crecimiento desde el día uno.' },
                  { icon: Layout, title: 'UX / UI', desc: 'Construyo interfaces intuitivas priorizando la usabilidad y la claridad.' }
                ]).map((card, i) => (
                  <div
                    key={i}
                    className={`p-8 rounded-xl text-center border transition-all group ${nxMode ? 'bg-[#1a0a00] border-orange-500/10 hover:border-orange-500/30' : 'bg-[#0f172a] border-white/5 hover:border-sky-400/30'}`}
                  >
                    <div className={`size-14 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${nxMode ? 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white' : 'bg-sky-400/10 text-sky-400 group-hover:bg-sky-400 group-hover:text-slate-900'}`}>
                      <card.icon size={28} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3">{card.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {(nxMode ? [
                  { step: '01', title: 'Observar', text: 'Escucho al usuario y al negocio antes de escribir una línea de código. El mejor código resuelve el problema correcto.' },
                  { step: '02', title: 'Construir', text: 'Prototipo rápido, valido rápido. Prefiero un MVP funcionando a un plan perfecto en un doc.' },
                  { step: '03', title: 'Evolucionar', text: 'Refactorizo, teseo, mejoro. Cada iteración deja el producto y el código mejor que antes.' }
                ] : [
                  { step: '01', title: 'Entender', text: 'Analizo el problema y detecto los puntos de fricción reales.' },
                  { step: '02', title: 'Prototipar', text: 'Construyo rápido para validar la solución antes de invertir tiempo.' },
                  { step: '03', title: 'Iterar', text: 'Refactorizo y pruebo hasta lograr consistencia y calidad.' }
                ]).map((item, i) => (
                  <div key={i} className={`rounded-xl p-6 border transition-colors duration-700 ${nxMode ? 'bg-[#120800] border-orange-500/10' : 'bg-[#0b1120] border-white/5'}`}>
                    <span className={`text-3xl font-black block mb-3 transition-colors duration-700 ${nxMode ? 'text-orange-400' : 'text-sky-400'}`}>{item.step}</span>
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
              <h2 className="text-3xl font-bold text-white">
                {nxMode ? 'ADN Fluxer' : 'El ADN'}
              </h2>
              {nxMode ? <Sparkles size={40} className="text-orange-500/30" /> : <Fingerprint size={40} className="text-slate-700" />}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(nxMode ? NX_DNA : [
                { id: '01', title: 'Curiosidad', text: 'Siempre preguntando "por qué" antes de "cómo". Entendiendo el problema central.' },
                { id: '02', title: 'Resiliencia', text: 'Los bugs son oportunidades de aprendizaje. Persistencia hasta encontrar la solución.' },
                { id: '03', title: 'Empatía', text: 'Construyendo para humanos. La experiencia de usuario es clave en cada desarrollo.' },
                { id: '04', title: 'Crecimiento', text: 'Mentalidad de estudiante permanente. Buscando mejorar con cada línea de código.' }
              ]).map((item) => (
                <div key={item.id} className={`p-8 rounded-xl border transition-all group ${nxMode ? 'bg-[#1a0a00] border-orange-500/10 hover:border-orange-500/30' : 'bg-[#0f172a] border-white/5 hover:border-sky-400/30'}`}>
                  <span className={`text-5xl font-black mb-6 block transition-colors ${nxMode ? 'text-orange-500/20 group-hover:text-orange-500/40' : 'text-slate-800 group-hover:text-sky-400/20'}`}>{item.id}</span>
                  <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-20 px-6 transition-colors duration-700 ${nxMode ? 'bg-[#1a0a00] border-orange-500/10' : 'bg-[#0b1120] border-white/5'}`}>
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">
              {nxMode ? 'Nos vemos el Viernes' : '¿Conectamos?'}
            </h2>
            {nxMode && (
              <div className={`mb-8 p-6 rounded-xl border bg-[#120800] border-orange-500/10`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <MapPin size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Assessment Presencial</p>
                    <p className="text-slate-400 text-sm">Talento Flux — 5ta Edición</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={14} className="text-orange-400" />
                    <span>Viernes 6 de Marzo</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock size={14} className="text-orange-400" />
                    <span>8:30 AM</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-slate-300">
                    <MapPin size={14} className="text-orange-400" />
                    <span>Plaza Galicia, Leiva 4070 - Piso 8</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6">
              {[
                { icon: Mail, text: 'manucosovschi@gmail.com', href: 'mailto:manucosovschi@gmail.com' },
                { icon: LinkIcon, text: 'linkedin.com/in/manuel-cosovschi', href: 'https://linkedin.com/in/manuel-cosovschi' },
                { icon: Github, text: 'github.com/manuel-cosovschi', href: 'https://github.com/manuel-cosovschi' }
              ].map((link, i) => (
                <a key={i} href={link.href} className={`flex items-center gap-4 text-slate-300 transition-all group ${nxMode ? 'hover:text-orange-400' : 'hover:text-sky-400'}`}>
                  <div className={`size-12 rounded-full flex items-center justify-center border transition-all ${nxMode ? 'bg-[#120800] border-orange-500/10 group-hover:border-orange-500/50 group-hover:bg-orange-500/10' : 'bg-[#0f172a] border-white/10 group-hover:border-sky-400/50 group-hover:bg-sky-400/10'}`}>
                    <link.icon size={20} />
                  </div>
                  <span className="text-lg font-medium">{link.text}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between items-start md:items-end">
            <div className="text-right hidden md:block">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                {nxMode ? 'Estado Assessment' : 'Estado Actual'}
              </p>
              <div className="flex items-center gap-3 justify-end">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 transition-colors duration-700 ${nxMode ? 'bg-orange-500' : 'bg-sky-400'}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-700 ${nxMode ? 'bg-orange-500' : 'bg-sky-400'}`} />
                </span>
                <span className="text-white font-bold text-lg">
                  {nxMode ? 'Confirmado — DNI Listo' : 'Buscando Primera Experiencia'}
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto mt-12 md:mt-0">
              <a
                href={nxMode ? 'mailto:manucosovschi@gmail.com?subject=Assessment Talento Flux - Manuel Cosovschi - Confirmación' : 'mailto:manucosovschi@gmail.com?subject=Contacto desde Portfolio'}
                onClick={() => logEvent('click_contact', { nxMode })}
                className={`block w-full md:w-auto text-center px-10 py-5 rounded-xl text-lg font-bold shadow-2xl transition-all active:scale-95 ${nxMode ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20' : 'bg-sky-400 hover:bg-sky-500 text-slate-900 shadow-sky-400/20'
                  }`}
              >
                {nxMode ? '¡Nos vemos en el Piso 8!' : 'Contactame'}
              </a>
              <p className="text-center md:text-right text-[10px] font-mono text-slate-600 mt-6 uppercase tracking-widest">
                © {new Date().getFullYear()} {profile.name}. {nxMode ? 'Hecho para NX.' : 'Portfolio Académico Profesional.'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
