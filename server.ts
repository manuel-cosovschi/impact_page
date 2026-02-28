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

// Safely handle __dirname and __filename in case of CJS compilation on Vercel
let __filename: string;
let __dirname: string;
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  __filename = "";
  __dirname = "";
}

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

interface Profile { id: number; name: string; title: string; subtitle: string; pitch: string; email: string; linkedin: string; github: string; status: string; }
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
  subtitle: 'Proyectos full-stack en producción.',
  pitch: 'Aprendí construyendo: Desde scripts de automatización hasta aplicaciones web completas durante la carrera. Capacidad para adaptarme a nuevas tecnologías (Node, React, Python) demostrada en proyectos académicos y prácticas. Busco mi primera experiencia formal con ganas de aportar valor desde el primer día y crecer profesionalmente.',
  email: 'manuel.cosovschi@example.com',
  linkedin: 'linkedin.com/in/manuelcosou',
  github: 'github.com/manuelcosou',
  status: 'DISPONIBLE'
};

const SEED_PROJECTS = [
  {
    title: 'FitNow App',
    type: 'Tesis',
    summary: 'App iOS en SwiftUI con backend en Node.js/Express y MySQL. Módulo de recomendaciones en Python usando Ridge Regression.',
    problem: 'Falta de personalización en rutinas de entrenamiento y seguimiento eficiente de telemetría.',
    solution: 'Implementación de IA para sugerencias personalizadas y optimización de navegación GPS/batería.',
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
    problem: 'Información operativa fragmentada y procesos de reserva manuales ineficientes.',
    solution: 'Estandarización de políticas y validación de disponibilidad en tiempo real mediante un wizard guiado.',
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
        name TEXT, title TEXT, subtitle TEXT, pitch TEXT, email TEXT, linkedin TEXT, github TEXT, status TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      this.db.prepare(`INSERT INTO profile (id, name, title, subtitle, pitch, email, linkedin, github, status) VALUES (1, @name, @title, @subtitle, @pitch, @email, @linkedin, @github, @status)`).run(SEED_PROFILE);
      
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

let db: DBAdapter = new InMemoryAdapter();

const initDB = async () => {
  try {
    if (process.env.VERCEL) {
        console.log("Vercel environment detected. Using InMemoryAdapter to avoid native module issues.");
        db = new InMemoryAdapter();
    } else {
        const sqlitePackage = "better-sqlite3";
        const DatabaseClass = (await import(sqlitePackage)).default;
        db = new SqliteAdapter(DatabaseClass, "impact.db");
    }
  } catch (e) {
    console.warn("Failed to load better-sqlite3 or initialize SQLite. Falling back to InMemoryAdapter.", e);
    db = new InMemoryAdapter();
  }
};

// Initialize DB immediately (won't block exports, but will run)
initDB();

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

app.post("/api/contact", contactLimiter, (req, res) => {
  const schema = z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(10) });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  db.saveContact(result.data.name, result.data.email, result.data.message);
  res.status(201).json({ status: "ok" });
});

app.get("/api/cv", (req, res) => {
  res.json({ url: "/cv-placeholder.pdf", message: "CV placeholder." });
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
    const vite = await import("vite");
    const viteServer = await vite.createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(viteServer.middlewares);
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
