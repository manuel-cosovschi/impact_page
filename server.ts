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
  github: 'github.com/manuel-cosovschi',
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

app.post("/api/contact", async (req: any, res: any) => {
  try {
    const schema = z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(10) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid data' });
    const { name, email, message } = result.data;
    try { db.saveContact(name, email, message); } catch (_) {}
    if (process.env.RESEND_API_KEY) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Portfolio <onboarding@resend.dev>',
            to: ['manucosovschi@gmail.com'],
            subject: `Nuevo mensaje de ${name} — Portfolio`,
            html: `<h2>Nuevo contacto</h2><p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Mensaje:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`
          })
        });
        const emailBody = await emailRes.json();
        console.log('[RESEND] status:', emailRes.status, 'body:', JSON.stringify(emailBody));
      } catch (e) {
        console.error('[RESEND] fetch error:', e);
      }
    } else {
      console.log('[RESEND] No API key set');
    }
    res.status(201).json({ status: "ok" });
  } catch (e) {
    console.error('Contact route error:', e);
    if (!res.headersSent) res.status(201).json({ status: "ok" });
  }
});

app.get("/api/cv", async (req, res) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 56;
    const W = width - margin * 2;

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    let y = height - margin;
    const black = rgb(0, 0, 0);
    const gray  = rgb(0.27, 0.27, 0.27);
    const lgray = rgb(0.6, 0.6, 0.6);

    const drawText = (text: string, x: number, yPos: number, font: any, size: number, color = black) => {
      page.drawText(text, { x, y: yPos, font, size, color });
    };

    const drawLine = (yPos: number, opacity = 0.4) => {
      page.drawLine({ start: { x: margin, y: yPos }, end: { x: margin + W, y: yPos }, thickness: 0.5, color: lgray, opacity });
    };

    const section = (title: string) => {
      y -= 14;
      drawText(title.toUpperCase(), margin, y, fontBold, 9, black);
      y -= 4;
      drawLine(y);
      y -= 10;
    };

    const wrap = (text: string, font: any, size: number, maxW: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxW) { lines.push(line); line = word; }
        else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };

    const drawWrapped = (text: string, x: number, font: any, size: number, maxW: number, lineH: number, color = black) => {
      const lines = wrap(text, font, size, maxW);
      lines.forEach(l => { drawText(l, x, y, font, size, color); y -= lineH; });
    };

    const bullet = (text: string) => {
      drawText('•', margin + 6, y, fontReg, 9, gray);
      drawWrapped(text, margin + 18, fontReg, 9, W - 18, 13, gray);
    };

    const job = (title: string, right: string, role: string, bullets: string[], italic?: string) => {
      drawText(title, margin, y, fontBold, 9.5);
      const rW = fontItal.widthOfTextAtSize(right, 8.5);
      drawText(right, margin + W - rW, y, fontItal, 8.5, gray);
      y -= 13;
      drawText(role, margin, y, fontReg, 9, gray);
      y -= 13;
      if (italic) { drawText(italic, margin, y, fontItal, 8.5, rgb(0.4,0.4,0.4)); y -= 12; }
      bullets.forEach(b => bullet(b));
      y -= 4;
    };

    const edu = (inst: string, right: string, desc: string) => {
      drawText(inst, margin, y, fontBold, 9.5);
      const rW = fontItal.widthOfTextAtSize(right, 8.5);
      drawText(right, margin + W - rW, y, fontItal, 8.5, gray);
      y -= 13;
      drawText(desc, margin, y, fontReg, 9, gray);
      y -= 16;
    };

    // --- Header ---
    const nameText = 'Manuel Cosovschi';
    const nameW = fontBold.widthOfTextAtSize(nameText, 22);
    drawText(nameText, (width - nameW) / 2, y, fontBold, 22);
    y -= 28;
    const contact = 'Mar del Plata, BS AS, Arg  •  linkedin.com/in/manuel-cosovschi  •  +54 223 538 3082  •  manucosovschi@gmail.com';
    const contW = fontReg.widthOfTextAtSize(contact, 8.5);
    drawText(contact, (width - contW) / 2, y, fontReg, 8.5, gray);
    y -= 10;
    drawLine(y);
    y -= 10;

    // --- Summary ---
    drawWrapped('Software Engineer junior próximo a graduarse, con experiencia práctica en desarrollo de aplicaciones web y mobile full-stack. He desarrollado proyectos reales utilizando Node.js, Express, SwiftUI y bases de datos SQL. Busco incorporarme a un equipo de desarrollo para seguir aprendiendo y aportar valor desde el primer día.', margin, fontItal, 9.5, W, 14, gray);
    y -= 4;
    drawLine(y);

    // --- Experiencia ---
    section('Experiencia Profesional');
    job('FitNow - Aplicación Fitness (Proyecto de Tesis)', 'Mar del Plata  |  Dic 2024 – Actualidad', 'Desarrollador Full-Stack', [
      'Desarrollé una aplicación mobile full-stack con backend propio para usuarios reales.',
      'Implementé APIs REST en Node.js/Express, frontend en SwiftUI, MySQL, JWT y geolocalización.'
    ]);
    job('Las Cañas Mar de Cobo - Web + Bot WhatsApp', 'Mar del Plata  |  Ene 2026 – Actualidad', 'Desarrollador Full-Stack', [
      'Plataforma web de reservas para complejo turístico con automatización de disponibilidad.',
      'Agente de WhatsApp con n8n y Meta API para gestión automatizada de reservas y consultas.'
    ]);
    job('Inmuebles Comerciales SRL (Prácticas Profesionales)', 'Mar del Plata  |  Jul 2024 – Dic 2024', 'Desarrollador Full-Stack', [
      'Participé en el desarrollo de una plataforma web inmobiliaria con Angular, SQL y lógica de negocio.'
    ]);
    job('Experiencia Internacional - EE. UU. (Work & Travel Program)', 'Vail/Boston  |  2019 – 2025', 'Rental Tech Lead  •  Lead Barista  •  Prep/Chief Cook', [
      'Trabajo en equipos multiculturales, liderazgo operativo y entornos de alta demanda.'
    ], 'Vail Sports · Delaware North · L.A. Burdick Chocolate');

    // --- Educación ---
    section('Educación');
    edu('Universidad CAECE', 'Mar del Plata  |  Mar 2019 – Jul 2026', 'Ingeniería en Sistemas  |  Promedio: 7.07  |  Finalizando: 1 materia pendiente.');
    edu('CEM English Institute', 'Mar del Plata  |  Mar 2014 – Dic 2017', 'Inglés Avanzado (C1/C2)');
    edu('Coderhouse - Desarrollo Web', 'Mar del Plata  |  Mar 2022 – Jun 2022', 'Curso de Desarrollo Web Full Stack');

    // --- Habilidades ---
    section('Habilidades');
    drawWrapped('Node.js · Express · JavaScript · SwiftUI · SQL · MySQL · Git · REST APIs · JWT · Postman · VS Code · React · n8n', margin, fontReg, 9, W, 13, gray);
    y -= 6;

    // --- Idiomas ---
    section('Idiomas');
    drawText('Español: Nativo  ·  Inglés: C1/C2 (fluido, experiencia laboral en EE. UU.)', margin, y, fontReg, 9, gray);

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Manuel_Cosovschi_CV.pdf"');
    res.end(Buffer.from(pdfBytes));
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
