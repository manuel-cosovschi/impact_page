import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const PORT = 3000;

export const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// --- DATA ADAPTERS ---

interface Profile { id: number; name: string; title: string; subtitle: string; pitch: string; email: string; linkedin: string; github: string; phone?: string; status: string; }
interface Project { id?: number; title: string; type: string; summary: string; problem: string; solution: string; stack: string[]; highlights: string[]; challenges: string[]; architecture_diagram: string; links: any; order_index?: number; }

interface DBAdapter {
  getProfile(): Profile | null;
  updateProfile(data: Partial<Profile>): void;
  getProjects(): Project[];
  createProject(data: Project): void;
  getUser(username: string): {username: string, password: string} | null;
  createUser(username: string, passwordHash: string): void;
  logEvent(eventType: string, page: string, metadata: any): void;
  getEventStats(): any[];
  saveContact(name: string, email: string, message: string): void;
  isReady(): boolean;
}

// Seed Data
const SEED_PROFILE = {
  id: 1,
  name: 'Manuel Cosovschi',
  title: 'Estudiante avanzado de Ingeniería en Sistemas',
  subtitle: 'Desarrollador Full Stack | En búsqueda activa',
  pitch: 'Me motiva integrar un equipo técnico donde pueda contribuir y seguir creciendo. Comparto el enfoque en el usuario y la mejora continua. He construido proyectos end-to-end para aprender haciendo, y busco un equipo donde pueda iterar, recibir feedback y aportar valor desde el primer día.',
  email: 'manucosovschi@gmail.com',
  linkedin: 'linkedin.com/in/manuel-cosovschi',
  github: 'github.com/manuelcosou',
  phone: '+54 223 538 3082',
  status: 'DISPONIBLE'
};

const SEED_PROJECTS = [
  {
    title: 'FitNow App',
    type: 'Tesis',
    summary: 'App iOS en SwiftUI con backend en Node.js/Express y MySQL. Exploré un módulo de recomendaciones en Python usando Ridge Regression.',
    problem: 'Falta de personalización en rutinas de entrenamiento y seguimiento eficiente de telemetría.',
    solution: 'Me interesa el uso de datos/ML aplicado. Lo exploré en FitNow y quiero seguir aprendiendo.',
    stack: ['SwiftUI', 'NodeJS', 'MySQL', 'Python', 'Jupyter'],
    highlights: ['Navegación paso a paso', 'Telemetría en tiempo real', 'Ridge Regression'],
    challenges: ['Optimización de batería', 'Manejo eficiente de datos GPS'],
    architecture_diagram: 'https://picsum.photos/seed/fitnow/800/600',
    links: { github: '#' }
  },
  {
    title: 'Las Cañas - Web',
    type: 'Producción',
    summary: 'Landing Page y Wizard de Reservas para complejo deportivo.',
    problem: 'Información operativa fragmentada y procesos de reserva manuales.',
    solution: 'Estandarización de políticas y validación de disponibilidad mediante un wizard guiado para mejorar la experiencia.',
    stack: ['React', 'Tailwind', 'NodeJS'],
    highlights: ['Wizard de reservas', 'Validación en tiempo real', 'Políticas unificadas'],
    challenges: ['Manejo de rangos bloqueados', 'UX simplificada'],
    architecture_diagram: 'https://picsum.photos/seed/lascanas/800/600',
    links: { web: '#' }
  },
  {
    title: 'Las Cañas - Bot',
    type: 'Automatización',
    summary: 'Bot de WhatsApp para gestión de reservas y FAQs.',
    problem: 'Alta carga de consultas repetitivas por canales de mensajería.',
    solution: 'Automatización con n8n y derivación a humano para casos complejos.',
    stack: ['n8n', 'JavaScript', 'WhatsApp API'],
    highlights: ['Flujos automatizados', 'Hand-off a humano', 'Sugerencia de fechas'],
    challenges: ['Tono de marca consistente', 'Manejo de excepciones'],
    architecture_diagram: 'https://picsum.photos/seed/bot/800/600',
    links: { github: '#' }
  },
  {
    title: 'Inmuebles Comerciales SRL',
    type: 'Prácticas',
    summary: 'Plataforma inmobiliaria para gestión de inmuebles comerciales.',
    problem: 'Necesidad de una herramienta interna para mantenimiento de catálogo y clientes.',
    solution: 'Desarrollo full-stack con Angular y SQL para gestión eficiente de datos.',
    stack: ['Angular', 'SQL', '.NET'],
    highlights: ['Panel de administración', 'Gestión de catálogo', 'Mantenimiento'],
    challenges: ['Integración con sistemas legados', 'Validación de datos'],
    architecture_diagram: 'https://picsum.photos/seed/inmuebles/800/600',
    links: { web: '#' }
  }
];

class InMemoryAdapter implements DBAdapter {
  private profile: Profile | null = null;
  private projects: Project[] = [];
  private events: any[] = [];
  private contacts: any[] = [];
  private users: any[] = [];

  constructor() {
    console.log("Initializing InMemoryAdapter...");
    this.seed();
  }

  private seed() {
    this.profile = { ...SEED_PROFILE };
    this.projects = SEED_PROJECTS.map((p, i) => ({ ...p, id: i + 1, order_index: i }));
    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    this.users.push({ username: 'admin', password: hashedPassword });
    console.log("InMemoryAdapter seeded.");
  }

  getProfile() { return this.profile; }
  updateProfile(data: Partial<Profile>) { if (this.profile) this.profile = { ...this.profile, ...data }; }
  getProjects() { return this.projects; }
  createProject(data: Project) { this.projects.push({ ...data, id: this.projects.length + 1 }); }
  getUser(username: string) { return this.users.find(u => u.username === username) || null; }
  createUser(username: string, passwordHash: string) { this.users.push({ username, password: passwordHash }); }
  logEvent(eventType: string, page: string, metadata: any) { this.events.push({ eventType, page, metadata, timestamp: new Date() }); }
  getEventStats() { 
    // Simple aggregation
    const counts: Record<string, number> = {};
    this.events.forEach(e => {
        const key = `${e.eventType}|${e.timestamp.toISOString().split('T')[0]}`;
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, count]) => {
        const [type, day] = key.split('|');
        return { event_type: type, day, count };
    });
  }
  saveContact(name: string, email: string, message: string) { this.contacts.push({ name, email, message, timestamp: new Date() }); }
  isReady() { return true; }
}

class SqliteAdapter implements DBAdapter {
  private db: any;

  constructor(DatabaseClass: any, path: string) {
    console.log(`Initializing SqliteAdapter at ${path}...`);
    this.db = new DatabaseClass(path);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.seed();
  }

  private initSchema() {
     this.db.exec(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT, title TEXT, subtitle TEXT, pitch TEXT, email TEXT, linkedin TEXT, github TEXT, phone TEXT, status TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, type TEXT, summary TEXT, problem TEXT, solution TEXT, stack TEXT, highlights TEXT, challenges TEXT, architecture_diagram TEXT, links TEXT, order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT, page TEXT, metadata TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT
      );
    `);
  }

  private seed() {
    const count = this.db.prepare("SELECT COUNT(*) as count FROM profile").get().count;
    if (count === 0) {
      this.db.prepare(`INSERT INTO profile (id, name, title, subtitle, pitch, email, linkedin, github, phone, status) VALUES (1, @name, @title, @subtitle, @pitch, @email, @linkedin, @github, @phone, @status)`).run(SEED_PROFILE);
      
      const insertProject = this.db.prepare(`INSERT INTO projects (title, type, summary, problem, solution, stack, highlights, challenges, architecture_diagram, links, order_index) VALUES (@title, @type, @summary, @problem, @solution, @stack, @highlights, @challenges, @architecture_diagram, @links, @order_index)`);
      
      SEED_PROJECTS.forEach((p, i) => {
        insertProject.run({
            ...p,
            stack: JSON.stringify(p.stack),
            highlights: JSON.stringify(p.highlights),
            challenges: JSON.stringify(p.challenges),
            links: JSON.stringify(p.links),
            order_index: i
        });
      });

      const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      this.db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
      console.log("SqliteAdapter seeded.");
    }
  }

  getProfile() { return this.db.prepare("SELECT * FROM profile WHERE id = 1").get(); }
  updateProfile(data: Partial<Profile>) {
    const sets = Object.keys(data).map(k => `${k} = @${k}`).join(", ");
    this.db.prepare(`UPDATE profile SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`).run(data);
  }
  getProjects() {
    return this.db.prepare("SELECT * FROM projects ORDER BY order_index ASC").all().map((p: any) => ({
        ...p,
        stack: JSON.parse(p.stack),
        highlights: JSON.parse(p.highlights),
        challenges: JSON.parse(p.challenges),
        links: JSON.parse(p.links)
    }));
  }
  createProject(data: Project) {
    this.db.prepare(`INSERT INTO projects (title, type, summary, problem, solution, stack, highlights, challenges, architecture_diagram, links) VALUES (@title, @type, @summary, @problem, @solution, @stack, @highlights, @challenges, @architecture_diagram, @links)`).run({
        ...data,
        stack: JSON.stringify(data.stack),
        highlights: JSON.stringify(data.highlights),
        challenges: JSON.stringify(data.challenges),
        links: JSON.stringify(data.links)
    });
  }
  getUser(username: string) { return this.db.prepare("SELECT * FROM users WHERE username = ?").get(username); }
  createUser(username: string, passwordHash: string) { this.db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, passwordHash); }
  logEvent(eventType: string, page: string, metadata: any) {
    this.db.prepare("INSERT INTO events (event_type, page, metadata) VALUES (?, ?, ?)").run(eventType, page, JSON.stringify(metadata));
  }
  getEventStats() {
    return this.db.prepare("SELECT event_type, COUNT(*) as count, date(timestamp) as day FROM events GROUP BY event_type, day ORDER BY day DESC").all();
  }
  saveContact(name: string, email: string, message: string) {
    this.db.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)").run(name, email, message);
  }
  isReady() { return true; }
}

// --- INITIALIZATION ---

let db: DBAdapter;

try {
  // Try to load better-sqlite3 dynamically
  // On Vercel, this might fail or we might want to skip it if we detect Vercel environment
  // But Vercel environment variable is not always reliable for "capabilities"
  // We'll try-catch the import.
  
  if (process.env.VERCEL) {
      console.log("Vercel environment detected. Using InMemoryAdapter to avoid native module issues.");
      db = new InMemoryAdapter();
  } else {
      // Use top-level await for dynamic import
      const DatabaseClass = (await import("better-sqlite3")).default;
      db = new SqliteAdapter(DatabaseClass, "impact.db");
  }
} catch (e) {
  console.warn("Failed to load better-sqlite3 or initialize SQLite. Falling back to InMemoryAdapter.", e);
  db = new InMemoryAdapter();
}

// --- ROUTES ---

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: { code: 401, message: "Unauthorized" } });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: { code: 403, message: "Forbidden" } });
    req.user = user;
    next();
  });
};

app.get("/api/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV, db: db.isReady(), adapter: db.constructor.name }));
app.get("/api/ping", (req, res) => res.send("pong"));

app.get("/api/profile", (req, res) => {
  const profile = db.getProfile();
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

app.get("/api/projects", (req, res) => {
  res.json(db.getProjects());
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.getUser(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: { code: 401, message: "Invalid credentials" } });
  }
});

app.post("/api/events", apiLimiter, (req, res) => {
  const schema = z.object({ eventType: z.string(), page: z.string(), metadata: z.record(z.string(), z.any()).optional() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  db.logEvent(result.data.eventType, result.data.page, result.data.metadata || {});
  res.status(201).json({ status: "ok" });
});

app.get("/api/events/stats", authenticateToken, (req, res) => {
  res.json(db.getEventStats());
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  const schema = z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(10) });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  const { name, email, message } = result.data;
  db.saveContact(name, email, message);
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: `"Portfolio" <${process.env.EMAIL_USER}>`,
        to: 'manucosovschi@gmail.com',
        subject: `Nuevo mensaje de ${name} — Portfolio`,
        html: `<h2>Nuevo contacto desde tu portfolio</h2><p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Mensaje:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`
      });
    } catch (e) {
      console.error('Email send error:', e);
    }
  }
  res.status(201).json({ status: "ok" });
});

app.get("/api/cv", async (req, res) => {
  try {
    const { default: PDFDocument } = await import('pdfkit') as any;
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Manuel_Cosovschi_CV.pdf"');
    doc.pipe(res);

    const W = 595 - 112; // usable width

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(22).text('Manuel Cosovschi', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor('#444')
      .text('Mar del Plata, BS AS, Arg  •  linkedin.com/in/manuel-cosovschi  •  +54 223 538 3082  •  manucosovschi@gmail.com', { align: 'center' });
    doc.moveDown(0.6);
    doc.moveTo(56, doc.y).lineTo(56 + W, doc.y).strokeColor('#999').lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    // --- Summary ---
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#222')
      .text('Software Engineer junior próximo a graduarse, con experiencia práctica en desarrollo de aplicaciones web y mobile full-stack. He desarrollado proyectos reales utilizando Node.js, Express, SwiftUI y bases de datos SQL, participando en el diseño de APIs REST, autenticación y lógica de negocio. Busco incorporarme a un equipo de desarrollo para seguir aprendiendo y aportar valor desde el primer día.', { align: 'justify' });
    doc.moveDown(0.8);
    doc.moveTo(56, doc.y).lineTo(56 + W, doc.y).strokeColor('#999').lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    // --- Section helper ---
    const section = (title: string) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(title.toUpperCase());
      doc.moveDown(0.15);
      doc.moveTo(56, doc.y).lineTo(56 + W, doc.y).strokeColor('#ccc').lineWidth(0.4).stroke();
      doc.moveDown(0.4);
    };

    const job = (title: string, location: string, period: string, role: string, bullets: string[], italic?: string) => {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000').text(title, { continued: false });
      const rightText = `${location} | ${period}`;
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#444')
        .text(rightText, 56, y, { width: W, align: 'right' });
      doc.moveDown(0.1);
      doc.font('Helvetica').fontSize(9).fillColor('#222').text(role);
      if (italic) { doc.moveDown(0.1); doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#555').text(italic); }
      doc.moveDown(0.2);
      bullets.forEach(b => {
        doc.font('Helvetica').fontSize(9).fillColor('#222')
          .text(`• ${b}`, { indent: 12, align: 'justify' });
      });
      doc.moveDown(0.6);
    };

    // --- Experiencia ---
    section('Experiencia Profesional');
    job('FitNow - Aplicación Fitness (Proyecto de Tesis)', 'Mar del Plata, Argentina', 'Dic 2024 – Actualidad', 'Desarrollador Full-Stack', [
      'Desarrollé una aplicación mobile full-stack con backend propio para usuarios reales.',
      'Implementé APIs REST en Node.js/Express, frontend en SwiftUI, MySQL, JWT y geolocalización.'
    ]);
    job('Las Cañas Mar de Cobo - Plataforma Web + Bot WhatsApp', 'Mar del Plata, Argentina', 'Ene 2026 – Actualidad', 'Desarrollador Full-Stack', [
      'Desarrollé una plataforma web de reservas para complejo turístico con automatización de disponibilidad y gestión operativa.',
      'Implementé un agente de WhatsApp con n8n y Meta API para la gestión automatizada de reservas y consultas frecuentes.'
    ]);
    job('Inmuebles Comerciales SRL (Prácticas Profesionales)', 'Mar del Plata, Argentina', 'Jul 2024 – Dic 2024', 'Desarrollador Full-Stack', [
      'Participé en el desarrollo de una plataforma web inmobiliaria con Angular, SQL y lógica de negocio.'
    ]);
    job('Experiencia Laboral Internacional - EE. UU. (Work & Travel Program)', 'Vail/Boston, USA', '2019 – 2025', 'Rental Tech Lead • Lead Barista • Prep/Chief Cook', [
      'Trabajo en equipos multiculturales, liderazgo operativo y entornos de alta demanda.'
    ], 'Vail Sports · Delaware North · L.A. Burdick Chocolate');

    // --- Educación ---
    section('Educación');
    const edu = (inst: string, loc: string, period: string, desc: string) => {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000').text(inst);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#444')
        .text(`${loc} | ${period}`, 56, y, { width: W, align: 'right' });
      doc.moveDown(0.1);
      doc.font('Helvetica').fontSize(9).fillColor('#222').text(desc);
      doc.moveDown(0.5);
    };
    edu('Universidad CAECE', 'Mar del Plata, Argentina', 'Mar 2019 – Jul 2026', 'Ingeniería en Sistemas | Promedio: 7.07 | Finalizando: 1 materia pendiente.');
    edu('CEM English Institute', 'Mar del Plata, Argentina', 'Mar 2014 – Dic 2017', 'Inglés Avanzado');
    edu('Coderhouse - Desarrollo Web', 'Mar del Plata, Argentina', 'Mar 2022 – Jun 2022', 'Curso de Desarrollo Web Full Stack');

    // --- Habilidades ---
    section('Habilidades');
    doc.font('Helvetica').fontSize(9).fillColor('#222')
      .text('Node.js · Express · JavaScript · SwiftUI · SQL · MySQL · Git · REST APIs · JWT · Postman · VS Code · React · n8n');
    doc.moveDown(0.8);

    // --- Idiomas ---
    section('Idiomas');
    doc.font('Helvetica').fontSize(9).fillColor('#222')
      .text('Español: Nativo · Inglés: C1/C2 (fluido, experiencia laboral en EE. UU.)');

    doc.end();
  } catch (e) {
    console.error('PDF generation error:', e);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

app.put("/api/profile", authenticateToken, (req, res) => {
  db.updateProfile(req.body);
  res.json({ status: "ok" });
});

app.post("/api/projects", authenticateToken, (req, res) => {
  db.createProject(req.body);
  res.status(201).json({ status: "ok" });
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start Server
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    if (!process.env.VERCEL) {
        const distPath = path.join(__dirname, "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          if (req.path.startsWith('/api')) return res.status(404).json({error: 'Not Found'});
          res.sendFile(path.join(distPath, "index.html"));
        });
    }
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

if (process.argv[1] === __filename) {
  startServer();
}
