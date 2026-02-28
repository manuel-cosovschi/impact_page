import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();

app.use(cors());
app.use(express.json());

// ── Seed Data (in-memory, no native modules) ──────────────────────────

const SEED_PROFILE = {
    id: 1,
    name: "Manuel Cosovschi",
    title: "Estudiante avanzado de Ingeniería en Sistemas",
    subtitle: "Proyectos full-stack en producción.",
    pitch:
        "Aprendí construyendo: Desde scripts de automatización hasta aplicaciones web completas durante la carrera. Capacidad para adaptarme a nuevas tecnologías (Node, React, Python) demostrada en proyectos académicos y prácticas. Busco mi primera experiencia formal con ganas de aportar valor desde el primer día y crecer profesionalmente.",
    email: "manucosovschi@gmail.com",
    linkedin: "linkedin.com/in/manuel-cosovschi",
    github: "github.com/manuel-cosovschi",
    status: "DISPONIBLE",
};

const SEED_PROJECTS = [
    {
        id: 1,
        title: "FitNow App",
        type: "Tesis",
        summary:
            "App iOS en SwiftUI con backend en Node.js/Express y MySQL. Módulo de recomendaciones en Python usando Ridge Regression.",
        problem:
            "Falta de personalización en rutinas de entrenamiento y seguimiento eficiente de telemetría.",
        solution:
            "Implementación de IA para sugerencias personalizadas y optimización de navegación GPS/batería.",
        stack: ["SwiftUI", "NodeJS", "MySQL", "Python", "Jupyter"],
        highlights: [
            "Navegación paso a paso",
            "Telemetría en tiempo real",
            "Ridge Regression",
        ],
        challenges: [
            "Optimización de batería",
            "Manejo eficiente de datos GPS",
        ],
        architecture_diagram: "https://picsum.photos/seed/fitnow/800/600",
        links: { github: "https://github.com/manuel-cosovschi" },
        order_index: 0,
    },
    {
        id: 2,
        title: "Las Cañas - Web",
        type: "Producción",
        summary: "Landing Page y Wizard de Reservas para complejo deportivo.",
        problem:
            "Información operativa fragmentada y procesos de reserva manuales ineficientes.",
        solution:
            "Estandarización de políticas y validación de disponibilidad en tiempo real mediante un wizard guiado.",
        stack: ["React", "Tailwind", "NodeJS"],
        highlights: [
            "Wizard de reservas",
            "Validación en tiempo real",
            "Políticas unificadas",
        ],
        challenges: ["Manejo de rangos bloqueados", "UX simplificada"],
        architecture_diagram: "https://picsum.photos/seed/lascanas/800/600",
        links: { web: "https://github.com/manuel-cosovschi" },
        order_index: 1,
    },
    {
        id: 3,
        title: "Las Cañas - Bot",
        type: "Automatización",
        summary: "Bot de WhatsApp para gestión de reservas y FAQs.",
        problem:
            "Alta carga de consultas repetitivas por canales de mensajería.",
        solution:
            "Automatización con n8n y derivación a humano para casos complejos.",
        stack: ["n8n", "JavaScript", "WhatsApp API"],
        highlights: [
            "Flujos automatizados",
            "Hand-off a humano",
            "Sugerencia de fechas",
        ],
        challenges: ["Tono de marca consistente", "Manejo de excepciones"],
        architecture_diagram: "https://picsum.photos/seed/bot/800/600",
        links: { github: "https://github.com/manuel-cosovschi" },
        order_index: 2,
    },
    {
        id: 4,
        title: "Inmuebles Comerciales SRL",
        type: "Prácticas",
        summary:
            "Plataforma inmobiliaria para gestión de inmuebles comerciales.",
        problem:
            "Necesidad de una herramienta interna para mantenimiento de catálogo y clientes.",
        solution:
            "Desarrollo full-stack con Angular y SQL para gestión eficiente de datos.",
        stack: ["Angular", "SQL", ".NET"],
        highlights: [
            "Panel de administración",
            "Gestión de catálogo",
            "Mantenimiento",
        ],
        challenges: [
            "Integración con sistemas legados",
            "Validación de datos",
        ],
        architecture_diagram: "https://picsum.photos/seed/inmuebles/800/600",
        links: { web: "https://github.com/manuel-cosovschi" },
        order_index: 3,
    },
];

// ── Routes ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", adapter: "InMemoryAdapter" });
});

app.get("/api/ping", (_req, res) => {
    res.send("pong");
});

app.get("/api/profile", (_req, res) => {
    res.json(SEED_PROFILE);
});

app.get("/api/projects", (_req, res) => {
    res.json(SEED_PROJECTS);
});

app.post("/api/events", (req, res) => {
    const schema = z.object({
        eventType: z.string(),
        page: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    // In serverless, events are ephemeral; just acknowledge
    res.status(201).json({ status: "ok" });
});

app.get("/api/cv", (_req, res) => {
    res.json({ url: "/cv-placeholder.pdf", message: "CV placeholder." });
});

app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

export default app;
