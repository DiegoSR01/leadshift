import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/user.entity';
import { Module } from '../entities/module.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { Assessment } from '../entities/assessment.entity';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/achievement.entity';
import { Result } from '../entities/result.entity';
import { UserProgress } from '../entities/user-progress.entity';

import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'leadshift',
  entities: [User, Module, Scenario, Exercise, Assessment, Achievement, UserAchievement, Result, UserProgress],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seeding database...');

  // ─── Clear existing data (ignore if tables don't exist yet) ───
  const tables = [
    'user_achievements', 'result', 'user_progress', 'assessment',
    'scenario', 'exercise', 'achievements', 'module', 'user',
  ];
  for (const t of tables) {
    await AppDataSource.query(`DELETE FROM "${t}"`).catch(() => {});
  }

  // ═══════════════════════════════════════════
  // 1. MODULES
  // ═══════════════════════════════════════════
  const moduleRepo = AppDataSource.getRepository(Module);

  const leadershipModuleId = uuid();
  const oralModuleId = uuid();
  const writtenModuleId = uuid();
  const teamworkModuleId = uuid();

  await moduleRepo.save([
    {
      id: leadershipModuleId,
      title: 'Liderazgo Situacional',
      icon: '🎯',
      type: 'leadership' as const,
      color: 'from-violet-500 to-purple-600',
      description: 'Desarrolla tu capacidad de adaptarte a diferentes situaciones de liderazgo mediante escenarios interactivos basados en el modelo de Hersey y Blanchard.',
      skills: ['Toma de decisiones', 'Gestión de equipos', 'Adaptabilidad', 'Resolución de conflictos'],
      duration: 45,
      levelLabel: 'Intermedio',
      locked: false,
      badge: '🎯',
      orderIndex: 0,
    },
    {
      id: oralModuleId,
      title: 'Comunicación Oral',
      icon: '🎤',
      type: 'oral' as const,
      color: 'from-blue-500 to-cyan-500',
      description: 'Mejora tus habilidades de presentación y comunicación oral mediante ejercicios prácticos evaluados con la rúbrica OCS-STEM.',
      skills: ['Estructura de presentaciones', 'Lenguaje técnico', 'Claridad', 'Gestión del nerviosismo'],
      duration: 30,
      levelLabel: 'Básico-Intermedio',
      locked: false,
      badge: '🎤',
      orderIndex: 1,
    },
    {
      id: writtenModuleId,
      title: 'Comunicación Escrita',
      icon: '✍️',
      type: 'written' as const,
      color: 'from-emerald-500 to-green-600',
      description: 'Fortalece tu redacción técnica, capacidad de síntesis y estructura documental mediante ejercicios evaluados con la Rúbrica TWR y procesamiento de lenguaje natural.',
      skills: ['Redacción técnica', 'Síntesis', 'Estructura documental', 'Claridad conceptual'],
      duration: 40,
      levelLabel: 'Avanzado',
      locked: false,
      badge: '✍️',
      orderIndex: 2,
    },
    {
      id: teamworkModuleId,
      title: 'Trabajo en Equipo Ágil',
      icon: '🤝',
      type: 'teamwork' as const,
      color: 'from-amber-500 to-orange-600',
      description: 'Aprende metodologías ágiles y cómo colaborar efectivamente en equipos de desarrollo de software.',
      skills: ['Scrum', 'Kanban', 'Colaboración', 'Comunicación en equipo'],
      duration: 35,
      levelLabel: 'Intermedio',
      locked: true,
      badge: '🤝',
      orderIndex: 3,
    },
  ]);

  // ═══════════════════════════════════════════
  // 2. LEADERSHIP SCENARIOS (Hersey & Blanchard)
  // ═══════════════════════════════════════════
  const scenarioRepo = AppDataSource.getRepository(Scenario);

  await scenarioRepo.save([
    {
      id: uuid(),
      moduleId: leadershipModuleId,
      title: 'Conflicto en el equipo de desarrollo',
      context: 'Lideras un equipo de desarrollo de software en una empresa de tecnología. Tu equipo está compuesto por 5 desarrolladores con diferentes niveles de experiencia. Durante una reunión de planificación de sprint, surge un conflicto entre dos miembros del equipo: Ana (desarrolladora senior con 5 años de experiencia) y Carlos (desarrollador junior con 6 meses). Ana propone una arquitectura de microservicios para el nuevo proyecto, mientras que Carlos insiste en un enfoque monolítico que aprendió en la universidad.',
      situation: 'La tensión ha escalado. Ana muestra frustración visible y Carlos se siente intimidado pero no quiere ceder. El resto del equipo permanece en silencio, incómodo. Tienes 15 minutos antes de que termine la reunión.',
      question: '¿Cómo actuarías como líder en esta situación?',
      options: [
        { id: 'A', text: 'Escuchas los argumentos técnicos de ambos, facilitas un análisis de pros y contras, y guías al equipo hacia una decisión basada en los requisitos del proyecto, permitiendo que Carlos aprenda del proceso.', style: 'Participativo / Coaching' },
        { id: 'B', text: 'Tomas el control inmediatamente, decides que se usará microservicios porque Ana tiene más experiencia, y asignas tareas específicas a cada miembro para avanzar rápidamente.', style: 'Directivo / Autoritario' },
        { id: 'C', text: 'Les dices que lo resuelvan entre ellos fuera de la reunión y que te avisen cuando tengan una propuesta consensuada. Mientras tanto, continúas con otros temas del sprint.', style: 'Delegativo / Laissez-faire' },
        { id: 'D', text: 'Reconoces públicamente ambas perspectivas, propones un spike técnico de 2 días para evaluar ambos enfoques con datos reales, y creas un espacio seguro donde Carlos pueda expresar sus ideas sin sentirse juzgado.', style: 'Democrático / Inclusivo' },
      ],
      bestAnswer: 'D',
      secondAnswer: 'A',
      feedback: {
        A: { score: 82, type: 'good' as const, title: 'Buen enfoque — Estilo Participativo', text: 'Facilitar el análisis demuestra habilidad de coaching. Sin embargo, podrías haber creado más espacio para que Carlos se sintiera incluido en la decisión final.' },
        B: { score: 55, type: 'warning' as const, title: 'Cuidado — Estilo demasiado Directivo', text: 'Aunque la experiencia de Ana es valiosa, imponer una decisión puede desmotivar a Carlos y crear resentimiento. El liderazgo directivo funciona mejor con seguidores M1.' },
        C: { score: 20, type: 'error' as const, title: 'Riesgo alto — Estilo Delegativo inapropiado', text: 'Delegar la resolución del conflicto sin guía puede escalar la tensión. Este estilo es apropiado solo con equipos M4 (alta madurez y compromiso).' },
        D: { score: 95, type: 'excellent' as const, title: '¡Excelente! — Estilo Democrático e Inclusivo', text: 'Reconocer ambas perspectivas, proponer evaluación con datos y crear un ambiente seguro demuestra liderazgo maduro. Este enfoque fomenta la cohesión del equipo y el aprendizaje continuo.' },
      },
      theory: 'Según el modelo de Hersey y Blanchard, el líder debe adaptar su estilo al nivel de madurez del seguidor. En este caso, Carlos (M2 — alguna competencia, bajo compromiso) necesita un estilo Persuasivo (S2), mientras que Ana (M3 — alta competencia) responde mejor a un estilo Participativo (S3). La solución óptima combina ambos enfoques, creando un ambiente de aprendizaje que beneficia a todo el equipo.',
      xpReward: 95,
      level: 'Intermedio',
      tags: ['Resolución de conflictos', 'Toma de decisiones', 'Dinámica de equipo'],
      orderIndex: 0,
      maturityLevel: 'M2',
    },
    {
      id: uuid(),
      moduleId: leadershipModuleId,
      title: 'Nuevo integrante sin experiencia',
      context: 'Tu equipo acaba de incorporar a Sofía, una recién egresada que nunca ha trabajado en proyectos reales de software. Muestra gran entusiasmo pero comete errores frecuentes en el código. Los otros miembros empiezan a quejarse porque tienen que revisar y corregir su trabajo constantemente.',
      situation: 'Sofía te pide una reunión individual. Se siente abrumada y cree que no está a la altura. Los plazos del proyecto están ajustados y no puedes permitir que la calidad baje.',
      question: '¿Cómo manejas esta situación?',
      options: [
        { id: 'A', text: 'Le asignas un mentor del equipo, defines objetivos de aprendizaje semanales con tareas progresivas, y programas revisiones de código uno a uno para acelerar su curva de aprendizaje.', style: 'Directivo-Coach (S2)' },
        { id: 'B', text: 'Le explicas que es normal sentirse así al inicio, le das acceso a recursos de capacitación online y le dices que pregunte cuando tenga dudas.', style: 'Delegativo (S4)' },
        { id: 'C', text: 'Reduces su carga de trabajo a tareas simples y de bajo riesgo hasta que adquiera más confianza y habilidades por su cuenta.', style: 'Directivo (S1)' },
        { id: 'D', text: 'Organizas una sesión con todo el equipo para redistribuir tareas, asignando a Sofía trabajo en par con diferentes miembros para que aprenda múltiples perspectivas.', style: 'Participativo (S3)' },
      ],
      bestAnswer: 'A',
      secondAnswer: 'D',
      feedback: {
        A: { score: 92, type: 'excellent' as const, title: '¡Excelente! — Estilo Persuasivo-Coach', text: 'Asignar un mentor y definir objetivos progresivos es la mejor estrategia para M1 (baja competencia, alto compromiso). Proporcionas dirección clara con apoyo emocional.' },
        B: { score: 35, type: 'error' as const, title: 'Insuficiente — Estilo demasiado Delegativo', text: 'Para alguien en nivel M1, simplemente dar recursos y decir "pregunta si tienes dudas" no proporciona la estructura necesaria. Necesita guía activa.' },
        C: { score: 60, type: 'warning' as const, title: 'Parcialmente correcto — Demasiado protector', text: 'Reducir la carga temporal puede ayudar, pero sin un plan de crecimiento claro, Sofía no desarrollará las habilidades necesarias y podría sentirse subvalorada.' },
        D: { score: 78, type: 'good' as const, title: 'Buen enfoque — Aprendizaje colaborativo', text: 'El pair programming es excelente, pero sin objetivos estructurados, el aprendizaje puede ser disperso. Combinar esto con un plan personalizado sería ideal.' },
      },
      theory: 'Sofía se encuentra en nivel de madurez M1: alta motivación pero baja competencia. El modelo de Hersey y Blanchard recomienda el estilo S1/S2 (Directivo/Persuasivo), proporcionando instrucciones claras, supervisión cercana y apoyo emocional. A medida que su competencia crezca, el estilo debe evolucionar hacia S3 (Participativo) y eventualmente S4 (Delegativo).',
      xpReward: 88,
      level: 'Básico',
      tags: ['Mentoría', 'Onboarding', 'Desarrollo de talento'],
      orderIndex: 1,
      maturityLevel: 'M1',
    },
    {
      id: uuid(),
      moduleId: leadershipModuleId,
      title: 'Equipo experimentado con fecha límite crítica',
      context: 'Tu equipo senior de 4 desarrolladores ha trabajado juntos durante 3 años. Son altamente competentes y están comprometidos. Sin embargo, un cliente acaba de adelantar la fecha de entrega dos semanas. El equipo necesita decidir qué features priorizar.',
      situation: 'El equipo te pide tu opinión. Históricamente, han tomado excelentes decisiones técnicas por su cuenta. La presión del plazo ha generado algo de estrés pero mantienen su profesionalismo.',
      question: '¿Cuál es tu enfoque de liderazgo?',
      options: [
        { id: 'A', text: 'Confías en su criterio técnico y les delegas la decisión de priorización, ofreciéndote como recurso si necesitan apoyo con el cliente o gestión de expectativas.', style: 'Delegativo (S4)' },
        { id: 'B', text: 'Tomas el control total de la priorización, defines exactamente qué se entrega y qué se posterga, y asignas tareas específicas a cada miembro.', style: 'Directivo (S1)' },
        { id: 'C', text: 'Organizas un workshop de priorización donde usas una matriz de impacto/esfuerzo, facilitando la discusión pero dejando que el equipo tome la decisión final.', style: 'Participativo (S3)' },
        { id: 'D', text: 'Le pides a cada miembro que prepare una propuesta individual de priorización y luego tú decides cuál implementar.', style: 'Persuasivo (S2)' },
      ],
      bestAnswer: 'A',
      secondAnswer: 'C',
      feedback: {
        A: { score: 95, type: 'excellent' as const, title: '¡Excelente! — Delegación con respaldo', text: 'Con un equipo M4 (alta competencia y compromiso), el estilo Delegativo es óptimo. Tu rol es remover obstáculos y gestionar la relación con el cliente.' },
        B: { score: 30, type: 'error' as const, title: 'Inapropiado — Control excesivo', text: 'Micro-gestionar a un equipo M4 genera frustración y reduce su motivación. Pierdes la ventaja de su experiencia colectiva.' },
        C: { score: 80, type: 'good' as const, title: 'Buen enfoque — Facilitación', text: 'Facilitar la decisión es bueno, pero con un equipo M4 podrías estar añadiendo un paso innecesario. Confía más en su autonomía.' },
        D: { score: 45, type: 'warning' as const, title: 'Subóptimo — Centralización innecesaria', text: 'Recoger inputs para decidir tú solo ignora la capacidad del equipo de llegar a consensos efectivos. Genera dependencia del líder.' },
      },
      theory: 'Un equipo con nivel de madurez M4 (alta competencia y alto compromiso) responde mejor al estilo S4 (Delegativo). El líder debe confiar en su capacidad de autogestión, enfocándose en remover obstáculos organizacionales y gestionar las relaciones con stakeholders externos. Intervenir demasiado puede ser contraproducente.',
      xpReward: 90,
      level: 'Avanzado',
      tags: ['Delegación', 'Equipos maduros', 'Gestión de crisis'],
      orderIndex: 2,
      maturityLevel: 'M4',
    },
  ]);

  // ═══════════════════════════════════════════
  // 3. ORAL EXERCISES (OCS-STEM Rubric)
  // ═══════════════════════════════════════════
  const exerciseRepo = AppDataSource.getRepository(Exercise);

  await exerciseRepo.save([
    {
      id: uuid(),
      moduleId: oralModuleId,
      title: 'Presentación de arquitectura de software',
      exerciseType: 'oral',
      subType: 'Exposición técnica',
      difficulty: 'Intermedio',
      duration: 3,
      description: 'Realiza una presentación explicando la arquitectura MVC a un equipo de desarrolladores junior que nunca ha trabajado con este patrón.',
      prompt: 'Prepara una presentación de 3 minutos sobre la arquitectura MVC (Model-View-Controller). Tu audiencia son desarrolladores junior. Debes cubrir:\n\n1. ¿Qué es MVC y por qué se usa?\n2. Los tres componentes principales y sus responsabilidades\n3. Un ejemplo práctico aplicado a un proyecto web\n4. Ventajas y cuándo NO usarlo',
      criteria: [
        { id: 'claridad', label: 'Claridad conceptual', weight: 25, description: 'Explicación clara y comprensible de los conceptos técnicos' },
        { id: 'estructura', label: 'Estructura lógica', weight: 20, description: 'Organización coherente del contenido presentado' },
        { id: 'vocabulario', label: 'Vocabulario técnico', weight: 20, description: 'Uso apropiado de terminología de ingeniería de software' },
        { id: 'adaptación', label: 'Adaptación al público', weight: 20, description: 'Adecuación del nivel técnico a la audiencia junior' },
        { id: 'fluidez', label: 'Fluidez y seguridad', weight: 15, description: 'Naturalidad y confianza durante la presentación' },
      ],
      tips: [
        'Comienza con una analogía cotidiana para explicar la separación de responsabilidades',
        'Usa diagramas mentales: describe la estructura visualmente',
        'Mantén un ritmo pausado — tu audiencia es junior',
        'Cierra con un ejemplo concreto que puedan replicar',
      ],
      xpReward: 80,
      orderIndex: 0,
    },
    {
      id: uuid(),
      moduleId: oralModuleId,
      title: 'Informe de estado de proyecto',
      exerciseType: 'oral',
      subType: 'Comunicación ejecutiva',
      difficulty: 'Avanzado',
      duration: 5,
      description: 'Presenta un informe de estado de proyecto a stakeholders no técnicos. Debes comunicar avances, riesgos y necesidades de manera clara y profesional.',
      prompt: 'Presenta un informe de 5 minutos sobre el estado de un proyecto de desarrollo de software para el director de la empresa (no técnico). Incluye:\n\n1. Resumen ejecutivo del avance (sprint 5 de 8)\n2. Logros principales del último mes\n3. Dos riesgos identificados y planes de mitigación\n4. Solicitud de recursos adicionales justificada\n5. Próximos pasos y timeline actualizado',
      criteria: [
        { id: 'claridad', label: 'Claridad del mensaje', weight: 25, description: 'Comunicación clara sin jerga técnica innecesaria' },
        { id: 'estructura', label: 'Estructura del informe', weight: 20, description: 'Formato profesional y organizado para audiencia ejecutiva' },
        { id: 'vocabulario', label: 'Lenguaje ejecutivo', weight: 20, description: 'Uso de lenguaje de negocios apropiado' },
        { id: 'adaptación', label: 'Gestión de riesgos', weight: 20, description: 'Presentación efectiva de riesgos y mitigaciones' },
        { id: 'fluidez', label: 'Confianza y profesionalismo', weight: 15, description: 'Proyección de seguridad y dominio del tema' },
      ],
      tips: [
        'Traduce métricas técnicas a impacto de negocio',
        'Presenta los riesgos siempre acompañados de soluciones',
        'Usa números y porcentajes concretos',
        'Practica el executive summary: lo más importante primero',
        'Prepárate para preguntas difíciles sobre el presupuesto',
      ],
      xpReward: 90,
      orderIndex: 1,
    },
  ]);

  // ═══════════════════════════════════════════
  // 4. WRITTEN EXERCISES (TWR Rubric)
  // ═══════════════════════════════════════════
  await exerciseRepo.save([
    {
      id: uuid(),
      moduleId: writtenModuleId,
      title: 'Síntesis de arquitectura de microservicios',
      exerciseType: 'written',
      subType: 'Síntesis técnica',
      difficulty: 'Intermedio',
      wordLimitMin: 150,
      wordLimitMax: 250,
      timeLimit: 20,
      instructions: 'Lee el siguiente texto técnico y escribe una síntesis dirigida a un equipo de QA que necesita entender la arquitectura para diseñar sus pruebas. Tu síntesis debe ser clara, concisa y adaptar el lenguaje técnico al público objetivo.',
      sourceText: 'La arquitectura de microservicios es un enfoque de desarrollo de software que estructura una aplicación como un conjunto de servicios pequeños e independientes. Cada microservicio se ejecuta en su propio proceso, se comunica mediante APIs REST o mensajería asíncrona, y puede ser desplegado de forma independiente. A diferencia de una arquitectura monolítica, donde todos los componentes comparten la misma base de código y base de datos, los microservicios permiten que equipos diferentes trabajen en servicios distintos usando tecnologías variadas. Los beneficios incluyen escalabilidad independiente, tolerancia a fallos, y ciclos de despliegue más rápidos. Sin embargo, presentan desafíos como la complejidad de la comunicación inter-servicios, la consistencia de datos distribuidos, y la necesidad de infraestructura robusta de monitoreo y orquestación.',
      placeholder: 'Escribe tu síntesis aquí...',
      criteria: [
        { id: 'claridad', label: 'Claridad y comprensión', weight: 30, description: 'El texto es claro y fácil de entender para el público objetivo' },
        { id: 'sintesis', label: 'Síntesis efectiva', weight: 25, description: 'Captura las ideas principales sin información redundante' },
        { id: 'adaptacion', label: 'Adaptación al público', weight: 25, description: 'El lenguaje y nivel técnico son apropiados para QA' },
        { id: 'estructura', label: 'Estructura y coherencia', weight: 20, description: 'Organización lógica y flujo coherente de ideas' },
      ],
      tips: [],
      xpReward: 75,
      orderIndex: 0,
    },
    {
      id: uuid(),
      moduleId: writtenModuleId,
      title: 'Informe técnico de incidente de seguridad',
      exerciseType: 'written',
      subType: 'Redacción técnica',
      difficulty: 'Avanzado',
      wordLimitMin: 200,
      wordLimitMax: 350,
      timeLimit: 30,
      instructions: 'Basándote en los datos del incidente, redacta un resumen ejecutivo para el CISO de la empresa. El informe debe ser profesional, preciso y orientado a acciones correctivas.',
      sourceText: 'Incidente detectado: 14 marzo 2026, 03:42 AM. Un atacante explotó una vulnerabilidad de inyección SQL en el endpoint "POST /api/users/search" del microservicio de autenticación. El ataque permitió extraer 2,340 registros de la tabla "user_credentials" incluyendo emails y hashes de contraseñas (bcrypt, factor 10). El atacante utilizó la herramienta sqlmap desde una IP originaria de un servicio VPN comercial. La detección ocurrió 4 horas después mediante alertas del WAF. El servicio fue parcheado a las 11:15 AM. No se detectó movimiento lateral. Se notificó a los usuarios afectados a las 2:00 PM.',
      placeholder: 'Redacta tu informe ejecutivo aquí...',
      criteria: [
        { id: 'claridad', label: 'Precisión técnica', weight: 30, description: 'Datos técnicos presentados con exactitud' },
        { id: 'estructura', label: 'Estructura del informe', weight: 25, description: 'Formato profesional y secciones claras' },
        { id: 'adaptacion', label: 'Orientación a acción', weight: 25, description: 'Recomendaciones concretas y accionables' },
        { id: 'sintesis', label: 'Concisión ejecutiva', weight: 20, description: 'Información relevante sin verbosidad innecesaria' },
      ],
      tips: [],
      xpReward: 85,
      orderIndex: 1,
    },
  ]);

  // ═══════════════════════════════════════════
  // 5. ACHIEVEMENTS
  // ═══════════════════════════════════════════
  const achievementRepo = AppDataSource.getRepository(Achievement);

  await achievementRepo.save([
    { id: uuid(), title: 'Primer escenario', description: 'Completa tu primer escenario de liderazgo', icon: '🎯', condition: 'scenarios >= 1' },
    { id: uuid(), title: 'Racha de 7 días', description: 'Mantén una racha de actividad de 7 días consecutivos', icon: '🔥', condition: 'streak >= 7' },
    { id: uuid(), title: 'Líder en formación', description: 'Alcanza el nivel 4 en la plataforma', icon: '⭐', condition: 'level >= 4' },
    { id: uuid(), title: 'Comunicador efectivo', description: 'Obtén más de 85 puntos en Comunicación Oral', icon: '🎤', condition: 'oral_score >= 85' },
    { id: uuid(), title: 'Escritor técnico', description: 'Obtén más de 85 puntos en Comunicación Escrita', icon: '📚', condition: 'written_score >= 85' },
    { id: uuid(), title: 'Maestro del liderazgo', description: 'Completa todos los escenarios de liderazgo con más de 80 puntos', icon: '👑', condition: 'all_leadership >= 80' },
  ]);

  // ═══════════════════════════════════════════
  // 6. DEMO USER + ADMIN USER
  // ═══════════════════════════════════════════
  const userRepo = AppDataSource.getRepository(User);
  const demoPassword = await bcrypt.hash('demo1234', 12);
  const adminPassword = await bcrypt.hash('admin1234', 12);

  await userRepo.save({
    id: uuid(),
    name: 'Demo Usuario',
    email: 'demo@leadshift.edu',
    password: demoPassword,
    university: 'ITToluca',
    career: 'Ingeniería en Sistemas Computacionales',
    semester: 7,
    avatar: 'DU',
    level: 1,
    xp: 0,
    streak: 0,
    settings: {
      notifications: true,
      emailDigest: false,
      publicProfile: true,
      darkMode: false,
    },
  });

  await userRepo.save({
    id: uuid(),
    name: 'Administrador LeadShift',
    email: 'admin@leadshift.edu',
    password: adminPassword,
    university: 'ITToluca',
    career: 'Admin',
    semester: 1,
    avatar: 'AL',
    role: 'admin',
    level: 1,
    xp: 0,
    streak: 0,
    settings: {
      notifications: true,
      emailDigest: false,
      publicProfile: false,
      darkMode: false,
    },
  });

  console.log('✅ Seed complete!');
  console.log('   Demo user:  demo@leadshift.edu  / demo1234');
  console.log('   Admin user: admin@leadshift.edu / admin1234');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
