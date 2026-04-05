// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyATzCfRxKDnIQ1vuxnCovyO8anrPviNflk",
    authDomain: "saludubuntu-26e4e.firebaseapp.com",
    projectId: "saludubuntu-26e4e",
    storageBucket: "saludubuntu-26e4e.firebasestorage.app",
    messagingSenderId: "265983589729",
    appId: "1:265983589729:web:6d6efa03eaf90ffaefd920"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
        return match[2];
    }
    return null;
}

// Quiz de Evaluación de Cobertura de Salud - Colombia

// Quiz Questions Configuration
const quizQuestions = [
    {
        id: 1,
        question: "¿Cuál es tu rango de edad?",
        type: "single",
        options: [
            { text: "18-30 años", value: "18-30", weight: 2, risk: "bajo" },
            { text: "31-45 años", value: "31-45", weight: 4, risk: "medio-bajo" },
            { text: "46-60 años", value: "46-60", weight: 7, risk: "medio-alto" },
            { text: "Más de 60 años", value: "60+", weight: 10, risk: "alto" }
        ]
    },
    {
        id: 2,
        question: "¿Cuál es tu ingreso mensual aproximado?",
        type: "input",
        inputType: "number",
        placeholder: "Ejemplo: 5.000.000",
        hint: "Ingresa el monto en pesos colombianos (COP)",
        key: "income",
        category: "financiero"
    },
    {
        id: 3,
        question: "¿Cuál es tu EPS actual?",
        type: "single",
        options: [
            { text: "Sura EPS", value: "sura", weight: 1 },
            { text: "Sanitas", value: "sanitas", weight: 2 },
            { text: "Compensar", value: "compensar", weight: 3 },
            { text: "Famisanar", value: "famisanar", weight: 4 },
            { text: "Nueva EPS", value: "nueva", weight: 5 },
            { text: "Salud Total", value: "salud-total", weight: 3 },
            { text: "Medimás", value: "medimas", weight: 6 },
            { text: "Coomeva", value: "coomeva", weight: 2 },
            { text: "Otra", value: "otra", weight: 5 },
            { text: "No tengo EPS actualmente", value: "ninguna", weight: 10 }
        ],
        category: "cobertura-actual"
    },
    {
        id: 4,
        question: "Acceso a atención prioritaria: ¿Cuánto tardarías en ser atendido por un especialista cuando lo necesitas?",
        type: "single",
        options: [
            { text: "Más de 15 días", value: "mas-15", weight: 10, risk: "alto" },
            { text: "7–15 días", value: "7-15", weight: 6, risk: "medio" },
            { text: "Menos de 7 días", value: "menos-7", weight: 2, risk: "bajo" }
        ],
        category: "acceso"
    },
    {
        id: 5,
        question: "Elección de profesional y clínica: Si necesitas atención de un especialista, ¿puedes elegir libremente médico o clínica?",
        type: "single",
        options: [
            { text: "No, estoy limitado a red de mi EPS", value: "no", weight: 8, risk: "alto" },
            { text: "A veces, según disponibilidad", value: "a-veces", weight: 5, risk: "medio" },
            { text: "Sí, tengo amplia libertad de elección", value: "si", weight: 1, risk: "bajo" }
        ],
        category: "libertad"
    },
    {
        id: 6,
        question: "Hospitalización con comodidad real: Si te hospitalizan por enfermedad o cirugía, ¿qué tipo de habitación recibirías normalmente?",
        type: "single",
        options: [
            { text: "Habitación compartida o estándar", value: "compartida", weight: 8, risk: "alto" },
            { text: "Depende de la disponibilidad", value: "depende", weight: 5, risk: "medio" },
            { text: "Habitación privada garantizada", value: "privada", weight: 1, risk: "bajo" }
        ],
        category: "comodidad"
    },
    {
        id: 7,
        question: "Cobertura de gastos intrahospitalarios: Si te internan, ¿quién pagaría los gastos dentro del hospital (exámenes, medicamentos, quirófano)?",
        type: "single",
        options: [
            { text: "Yo tendría que pagar de mi bolsillo", value: "yo", weight: 10, risk: "crítico" },
            { text: "Mi EPS cubre parcialmente", value: "eps-parcial", weight: 6, risk: "medio-alto" },
            { text: "Un seguro privado cubriría gran parte", value: "seguro-privado", weight: 1, risk: "bajo" }
        ],
        category: "cobertura-financiera"
    },
    {
        id: 8,
        question: "Exámenes rápidos cuando se necesitan: Si tu médico pide exámenes urgentes, ¿cuánto tiempo tardarías en realizarlos?",
        type: "single",
        options: [
            { text: "Más de 2 semanas", value: "mas-2-semanas", weight: 9, risk: "alto" },
            { text: "7–14 días", value: "7-14-dias", weight: 5, risk: "medio" },
            { text: "Menos de 7 días", value: "menos-7-dias", weight: 2, risk: "bajo" }
        ],
        category: "agilidad"
    },
    {
        id: 9,
        question: "¿Tienes alguna condición médica preexistente o enfermedad crónica?",
        type: "single",
        options: [
            { text: "No, estoy completamente sano/a", value: "no", weight: 1 },
            { text: "Condiciones menores controladas (ej: alergias, gastritis)", value: "menor", weight: 4 },
            { text: "Condiciones crónicas (ej: diabetes, hipertensión)", value: "cronica", weight: 8 },
            { text: "Condiciones que requieren seguimiento constante", value: "grave", weight: 10 }
        ],
        category: "salud"
    },
    {
        id: 10,
        question: "¿Tienes familiares a tu cargo que también necesitan cobertura de salud?",
        type: "single",
        options: [
            { text: "No, solo yo", value: "solo", weight: 1 },
            { text: "1-2 personas (pareja, hijo/a)", value: "1-2", weight: 5 },
            { text: "3-4 personas", value: "3-4", weight: 7 },
            { text: "5 o más personas", value: "5+", weight: 9 }
        ],
        category: "dependientes"
    }
];

// Application State
let currentQuestionIndex = 0;
let userAnswers = {};
let quizScore = 0;
let riskProfile = {};

// Helper: does user have family dependents?
function hasFamilyDependents() {
    return userAnswers[10] && userAnswers[10] !== 'solo';
}

// DOM Elements
const startQuizBtn = document.getElementById('startQuiz');
const heroSection = document.querySelector('.hero');
const quizSection = document.getElementById('quizSection');
const resultsSection = document.getElementById('resultsSection');
const quizContent = document.getElementById('quizContent');
const progressFill = document.getElementById('progressFill');
const currentQuestionSpan = document.getElementById('currentQuestion');
const totalQuestionsSpan = document.getElementById('totalQuestions');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const quoteModal = document.getElementById('quoteModal');
const closeModal = document.getElementById('closeModal');
const quoteForm = document.getElementById('quoteForm');
const restartBtn = document.getElementById('restartBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Modal view elements
const formView = document.getElementById('formView');
const successView = document.getElementById('successView');
const errorView = document.getElementById('errorView');
const successCloseBtn = document.getElementById('successCloseBtn');
const errorRetryBtn = document.getElementById('errorRetryBtn');

// Initialize
totalQuestionsSpan.textContent = quizQuestions.length;

// Event Listeners
startQuizBtn.addEventListener('click', startQuiz);
prevBtn.addEventListener('click', previousQuestion);
nextBtn.addEventListener('click', nextQuestion);
closeModal.addEventListener('click', closeQuoteModal);
quoteForm.addEventListener('submit', handleQuoteSubmission);
restartBtn.addEventListener('click', restartQuiz);
successCloseBtn.addEventListener('click', closeQuoteModal);
errorRetryBtn.addEventListener('click', showFormView);

// Close modal on outside click
quoteModal.addEventListener('click', (e) => {
    if (e.target === quoteModal) {
        closeQuoteModal();
    }
});

// Start Quiz
function startQuiz() {
    heroSection.style.display = 'none';
    quizSection.style.display = 'block';
    renderQuestion();
    
    if (typeof fbq !== 'undefined') {
        fbq('track', 'StartQuiz');
    }
}

// Render Current Question
function renderQuestion() {
    const question = quizQuestions[currentQuestionIndex];

    let questionHTML = `
        <div class="question-container">
            <h2 class="question-title">${question.question}</h2>
    `;

    if (question.type === 'single') {
        questionHTML += '<div class="options-grid">';
        question.options.forEach((option, index) => {
            const isSelected = userAnswers[question.id] === option.value;
            questionHTML += `
                <div class="option-card ${isSelected ? 'selected' : ''}" data-value="${option.value}" data-weight="${option.weight}">
                    <div class="option-radio"></div>
                    <div class="option-text">${option.text}</div>
                </div>
            `;
        });
        questionHTML += '</div>';
    } else if (question.type === 'input') {
        const savedValue = userAnswers[question.key] || '';
        const displayValue = savedValue ? formatNumberWithDots(savedValue) : '';
        const inputType = question.inputType === 'number' ? 'text' : question.inputType;
        const inputMode = question.inputType === 'number' ? 'inputmode="numeric"' : '';
        questionHTML += `
            <div class="input-group">
                <label class="input-label" for="questionInput">${question.hint || ''}</label>
                <input 
                    type="${inputType}" 
                    ${inputMode}
                    id="questionInput" 
                    class="input-field" 
                    placeholder="${question.placeholder}"
                    value="${displayValue}"
                    required
                >
                ${question.hint ? `<p class="input-hint">${question.hint}</p>` : ''}
            </div>
        `;
    }

    questionHTML += '</div>';
    quizContent.innerHTML = questionHTML;

    // Add event listeners for options
    if (question.type === 'single') {
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', () => selectOption(card));
        });
    } else if (question.type === 'input') {
        const input = document.getElementById('questionInput');
        input.addEventListener('input', handleInputChange);
        
        if (userAnswers[question.key]) {
            nextBtn.style.display = 'block';
        }
    }

    updateProgress();
    updateNavigationButtons();
}

// Select Option
function selectOption(selectedCard) {
    const question = quizQuestions[currentQuestionIndex];
    const allCards = document.querySelectorAll('.option-card');
    
    allCards.forEach(card => card.classList.remove('selected'));
    selectedCard.classList.add('selected');
    
    userAnswers[question.id] = selectedCard.dataset.value;
    userAnswers[`weight_${question.id}`] = parseInt(selectedCard.dataset.weight);
    
    nextBtn.style.display = 'block';
    
    // Auto-advance after a short delay
    setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            nextQuestion();
        } else {
            calculateResults();
        }
    }, 300);
}

// Format number with dot as thousands separator (Colombian style)
function formatNumberWithDots(value) {
    const num = String(value).replace(/\D/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Handle Input Change
function handleInputChange(e) {
    const question = quizQuestions[currentQuestionIndex];
    const input = e.target;
    
    // Strip non-digits, format with dots, and keep cursor in the right spot
    const rawDigits = input.value.replace(/\D/g, '');
    const formatted = formatNumberWithDots(rawDigits);
    
    // Calculate cursor position after formatting
    const cursorPos = input.selectionStart;
    const prevLength = input.value.length;
    
    input.value = formatted;
    
    // Adjust cursor position based on length change
    const diff = formatted.length - prevLength;
    const newCursor = Math.max(0, cursorPos + diff);
    input.setSelectionRange(newCursor, newCursor);
    
    if (rawDigits) {
        // Store raw number (without dots) in userAnswers
        userAnswers[question.key] = rawDigits;
        nextBtn.style.display = 'block';
    } else {
        delete userAnswers[question.key];
        nextBtn.style.display = 'none';
    }
}

// Navigation Functions
function nextQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    
    if (question.type === 'input') {
        const input = document.getElementById('questionInput');
        if (!input.value) {
            input.focus();
            input.style.borderColor = '#dc3545';
            setTimeout(() => input.style.borderColor = '', 1500);
            return;
        }
    } else if (!userAnswers[question.id]) {
        return;
    }
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        calculateResults();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

// Update Progress
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
}

// Update Navigation Buttons
function updateNavigationButtons() {
    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    
    const question = quizQuestions[currentQuestionIndex];
    if (question.type === 'single' && userAnswers[question.id]) {
        nextBtn.style.display = 'block';
    } else if (question.type === 'input' && userAnswers[question.key]) {
        nextBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'none';
    }
}

// Calculate Results
function calculateResults() {
    loadingOverlay.classList.add('active');
    
    let totalWeight = 0;
    let maxPossibleWeight = 0;
    
    quizQuestions.forEach(question => {
        if (question.type === 'single') {
            const weight = userAnswers[`weight_${question.id}`] || 0;
            totalWeight += weight;
            maxPossibleWeight += 10;
        }
    });
    
    quizScore = Math.round((totalWeight / maxPossibleWeight) * 100);
    
    analyzeRiskProfile();
    
    if (typeof fbq !== 'undefined') {
        fbq('track', 'CompleteQuiz', {
            score: quizScore,
            income: userAnswers.income || 0
        });
    }
    
    console.log('=== RESULTADOS DEL QUIZ ===');
    console.log('Score:', quizScore + '%');
    console.log('Nivel de riesgo:', riskProfile.level);
    console.log('Respuestas:', userAnswers);
    console.log('Tiene familiares:', hasFamilyDependents());
    console.log('========================');
    
    setTimeout(() => {
        loadingOverlay.classList.remove('active');
        showResults();
    }, 1000);
}

// Analyze Risk Profile
function analyzeRiskProfile() {
    const income = parseInt(userAnswers.income) || 0;
    const age = userAnswers[1];
    const withFamily = hasFamilyDependents();
    
    let riskLevel = 'bajo';
    let mainRisks = [];
    let recommendation = '';
    
    if (quizScore >= 70) {
        riskLevel = 'crítico';
        mainRisks = [
            'Tiempos de espera prolongados que pueden agravar condiciones médicas',
            'Falta de libertad para elegir especialistas de confianza',
            'Riesgo de gastos de bolsillo significativos en emergencias'
        ];
        if (withFamily) {
            mainRisks.push('Cobertura limitada que no protege tu patrimonio familiar');
        } else {
            mainRisks.push('Cobertura limitada que no protege tu patrimonio');
        }
        
        recommendation = withFamily
            ? 'Necesitas urgentemente complementar tu cobertura actual con una póliza de salud que te brinde acceso prioritario, libertad de elección y protección financiera real para ti y tu familia.'
            : 'Necesitas urgentemente complementar tu cobertura actual con una póliza de salud que te brinde acceso prioritario, libertad de elección y protección financiera real.';
        
    } else if (quizScore >= 45) {
        riskLevel = 'medio-alto';
        mainRisks = [
            'Demoras en atención que pueden afectar tu salud y productividad',
            'Limitaciones en la elección de médicos y clínicas',
            'Posibles copagos y gastos adicionales en procedimientos',
            'Falta de comodidad en hospitalizaciones'
        ];
        
        recommendation = withFamily
            ? 'Es muy recomendable que consideres una póliza complementaria de salud para mejorar tus tiempos de atención, ampliar tus opciones y proteger el bolsillo de toda tu familia.'
            : 'Es muy recomendable que consideres una póliza complementaria de salud para mejorar tus tiempos de atención, ampliar tus opciones y proteger tu bolsillo.';
        
    } else {
        riskLevel = 'bajo';
        mainRisks = [
            'Tu cobertura actual parece adecuada para tus necesidades',
            'Tienes acceso relativamente ágil a servicios de salud',
            'Cuentas con cierta libertad de elección'
        ];
        
        recommendation = 'Tu cobertura actual es funcional. Aun así, una póliza complementaria podría darte mayor tranquilidad y beneficios adicionales como habitación privada y atención preferencial.';
    }
    
    riskProfile = {
        level: riskLevel,
        score: quizScore,
        mainRisks: mainRisks,
        recommendation: recommendation,
        income: income,
        age: age
    };
}

// Show Results
function showResults() {
    quizSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    const scorePercentage = document.getElementById('scorePercentage');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsHeading = document.getElementById('resultsHeading');
    const resultsDescription = document.getElementById('resultsDescription');
    const benefitsGrid = document.getElementById('benefitsGrid');
    const ctaSection = document.getElementById('ctaSection');
    
    const withFamily = hasFamilyDependents();
    
    animateScore(quizScore);
    
    let resultTitle = '';
    let resultHeading = '';
    let resultMessage = '';
    let emphaticMessage = '';
    let ctaMessage = '';
    let benefits = [];
    
    if (riskProfile.level === 'crítico') {
        resultTitle = '⚠️ Tu Situación Requiere Atención Urgente';
        resultHeading = 'Nivel de Riesgo: CRÍTICO';
        resultMessage = withFamily
            ? 'Hemos identificado varias señales importantes en tu situación actual que podrían poner en riesgo tu salud, la de tu familia y tu estabilidad financiera.'
            : 'Hemos identificado varias señales importantes en tu situación actual que podrían poner en riesgo tu salud y estabilidad financiera.';
        
        emphaticMessage = withFamily
            ? 'Entendemos que la salud es lo más importante para ti y tu familia. La buena noticia es que estás tomando el primer paso al evaluar tu situación. Proteger la tranquilidad de todos está a tu alcance.'
            : 'Entendemos que la salud es lo más importante. La buena noticia es que estás tomando el primer paso al evaluar tu situación. Proteger tu tranquilidad y tu bolsillo está a tu alcance.';
        
        ctaMessage = withFamily
            ? 'Permítenos mostrarte cómo una póliza de salud complementaria puede transformar el acceso a servicios médicos de calidad para ti y tu familia, sin comprometer tus finanzas.'
            : 'Permítenos mostrarte cómo una póliza de salud complementaria puede transformar tu acceso a servicios médicos de calidad, sin comprometer tus finanzas.';
        
        benefits = [
            {
                icon: '⏱️',
                title: 'Atención Prioritaria',
                description: 'Acceso a especialistas en menos de 48 horas, sin largas esperas que comprometan tu salud.'
            },
            {
                icon: '🏥',
                title: 'Libertad Total',
                description: 'Elige libremente entre las mejores clínicas y médicos especialistas del país.'
            },
            {
                icon: '💰',
                title: 'Protección Financiera',
                description: withFamily
                    ? 'Cobertura integral de gastos hospitalarios, medicamentos y procedimientos. El patrimonio de tu familia queda protegido.'
                    : 'Cobertura integral de gastos hospitalarios, medicamentos y procedimientos. Tu patrimonio queda protegido.'
            },
            {
                icon: '🛏️',
                title: 'Comodidad Garantizada',
                description: 'Habitación privada en todas tus hospitalizaciones, para tu recuperación en paz.'
            }
        ];
        
    } else if (riskProfile.level === 'medio-alto') {
        resultTitle = '⚡ Tu Cobertura Tiene Puntos de Mejora';
        resultHeading = 'Nivel de Riesgo: MEDIO-ALTO';
        resultMessage = withFamily
            ? 'Tu situación actual es manejable, pero hemos detectado algunas áreas donde tú y tu familia podrían estar más protegidos y tener mejor acceso a servicios de salud.'
            : 'Tu situación actual es manejable, pero hemos detectado algunas áreas donde podrías estar más protegido y tener mejor acceso a servicios de salud.';
        
        emphaticMessage = withFamily
            ? 'Sabemos que quieres lo mejor para ti y tu familia. Mejorar la cobertura de salud de todos no es un gasto, es una inversión en tranquilidad y calidad de vida.'
            : 'Sabemos que quieres lo mejor para tu bienestar. Mejorar tu cobertura de salud no es un gasto, es una inversión en tranquilidad y calidad de vida.';
        
        ctaMessage = withFamily
            ? 'Déjanos mostrarte opciones accesibles que pueden marcar una gran diferencia para ti y tu familia cuando más lo necesiten.'
            : 'Déjanos mostrarte opciones accesibles que pueden marcar una gran diferencia en tu día a día y cuando más lo necesites.';
        
        benefits = [
            {
                icon: '⚡',
                title: 'Agilidad en Atención',
                description: 'Reduce drásticamente tus tiempos de espera para citas y exámenes médicos.'
            },
            {
                icon: '🎯',
                title: 'Más Opciones',
                description: 'Amplía tu red de médicos y clínicas disponibles para atenderte.'
            },
            {
                icon: '💵',
                title: 'Menos Gastos de Bolsillo',
                description: 'Reduce o elimina copagos y gastos imprevistos en procedimientos.'
            },
            {
                icon: '✨',
                title: 'Mejor Experiencia',
                description: 'Atención personalizada y comodidades que marcan la diferencia.'
            }
        ];
        
    } else {
        resultTitle = '✅ Tu Cobertura Está en Buen Estado';
        resultHeading = 'Nivel de Riesgo: BAJO';
        resultMessage = 'Tu situación actual muestra que cuentas con una cobertura funcional y acceso razonable a servicios de salud.';
        
        emphaticMessage = 'Es genial que ya cuentes con una buena base de protección. Aun así, siempre hay espacio para mejorar tu experiencia y tranquilidad.';
        
        ctaMessage = 'Si te interesa conocer cómo llevar tu cobertura al siguiente nivel con beneficios premium, estamos aquí para ayudarte.';
        
        benefits = [
            {
                icon: '⭐',
                title: 'Beneficios Premium',
                description: 'Accede a servicios VIP y atención preferencial en las mejores clínicas.'
            },
            {
                icon: '🌟',
                title: 'Tranquilidad Extra',
                description: 'Mayor cobertura para procedimientos complejos y tratamientos especializados.'
            }
        ];

        // Only add family benefit if user has dependents
        if (withFamily) {
            benefits.push({
                icon: '👨‍👩‍👧‍👦',
                title: 'Protección Familiar',
                description: 'Opciones para extender cobertura premium a toda tu familia.'
            });
        }
    }

    // For crítico and medio-alto, add family benefit only if user has dependents
    if (withFamily && (riskProfile.level === 'crítico' || riskProfile.level === 'medio-alto')) {
        benefits.push({
            icon: '👨‍👩‍👧‍👦',
            title: 'Protección Familiar',
            description: 'Planes que cubren a toda tu familia con la misma calidad y beneficios.'
        });
    }
    
    // Render results
    resultsTitle.textContent = resultTitle;
    resultsHeading.textContent = resultHeading;
    
    resultsDescription.innerHTML = `
        <div class="result-analysis">
            <h4>📊 Análisis de Tu Situación</h4>
            <p>${resultMessage}</p>
            
            <h4 style="margin-top: 25px;">🎯 Riesgos Principales Identificados</h4>
            <ul class="risks-list">
                ${riskProfile.mainRisks.map(risk => `<li>${risk}</li>`).join('')}
            </ul>
            
            <h4 style="margin-top: 25px;">💡 Recomendación Profesional</h4>
            <p class="recommendation">${riskProfile.recommendation}</p>
            
            <div class="emphatic-message">
                <p>❤️ <strong>${emphaticMessage}</strong></p>
            </div>
        </div>
    `;
    
    // Render benefits
    benefitsGrid.innerHTML = benefits.map(benefit => `
        <div class="benefit-card">
            <div class="benefit-icon">${benefit.icon}</div>
            <h4>${benefit.title}</h4>
            <p>${benefit.description}</p>
        </div>
    `).join('');
    
    // Show CTA
    if (riskProfile.level !== 'bajo' || quizScore >= 30) {
        ctaSection.innerHTML = `
            <div class="cta-content">
                <h3>🎁 ${ctaMessage}</h3>
                <p class="cta-subtitle">Sin compromiso • Asesoría gratuita • Respuesta en 24 horas</p>
                <button class="btn-quote" id="requestQuoteBtn">Recibir Asesoría Personalizada</button>
                <p class="cta-note">✓ Comparamos las mejores opciones del mercado para ti<br>✓ Te ayudamos a encontrar el plan perfecto según tu presupuesto</p>
            </div>
        `;
        
        document.getElementById('requestQuoteBtn').addEventListener('click', openQuoteModal);
    } else {
        ctaSection.innerHTML = `
            <div class="cta-content-light">
                <p>${ctaMessage}</p>
                <button class="btn-quote-secondary" id="requestQuoteBtn">Explorar Opciones Premium</button>
            </div>
        `;
        
        document.getElementById('requestQuoteBtn').addEventListener('click', openQuoteModal);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Animate Score
function animateScore(targetScore) {
    const scoreElement = document.getElementById('scorePercentage');
    const scoreCircle = document.getElementById('scoreCircle');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    
    let currentScore = 0;
    const duration = 2000;
    const increment = targetScore / (duration / 16);
    
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= targetScore) {
            currentScore = targetScore;
            clearInterval(timer);
        }
        
        scoreElement.textContent = Math.round(currentScore);
        
        const offset = circumference - (currentScore / 100) * circumference;
        scoreCircle.style.strokeDashoffset = offset;
    }, 16);
}

// Quote Modal Functions
function openQuoteModal() {
    // Always reset to form view when opening
    showFormView();
    quoteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead');
    }
}

function closeQuoteModal() {
    quoteModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showFormView() {
    formView.style.display = 'block';
    successView.style.display = 'none';
    errorView.style.display = 'none';
}

function showSuccessView(name) {
    formView.style.display = 'none';
    errorView.style.display = 'none';
    successView.style.display = 'block';
    
    document.getElementById('successTitle').textContent = `¡Gracias ${name}! 🎉`;
    document.getElementById('successMessage').textContent = 'Tu información fue enviada correctamente. Un asesor te contactará pronto.';
}

function showErrorView() {
    formView.style.display = 'none';
    successView.style.display = 'none';
    errorView.style.display = 'block';
}

// Handle Quote Form Submission
async function handleQuoteSubmission(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.replace(/\D/g, "");
    const city = document.getElementById('city').value.trim();
    const notes = document.getElementById('notes').value.trim();

    const income = parseInt(userAnswers.income) || 0;

    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const eventId = `lead_${Date.now()}_${phone}`;

    const fbp = getCookie('_fbp') || null;
    const fbc = getCookie('_fbc') || null;

    const leadData = {
        fullName,
        firstName,
        lastName,
        email,
        phone,
        city,
        country: "CO",

        ingresoMensual: income,
        incomeBracket: income >= 8000000 ? "8M+" : "menor_8M",
        isQualified: income >= 8000000,

        quizScore,
        riskLevel: riskProfile.level,
        quizAnswers: userAnswers,

        source: "quiz_landing_page",

        eventId,
        eventSentToMeta: false,

        fbp,
        fbc,
        user_agent: navigator.userAgent,

        createdAt: serverTimestamp()
    };

    try {
        const leadRef = doc(db, "leads", phone);
        await setDoc(leadRef, leadData, { merge: true });

        console.log("✅ Lead guardado en Firestore");

        if (income >= 4000000 && typeof fbq !== 'undefined') {
            fbq('track', 'SubmitApplication', {
                value: income,
                currency: 'COP',
                quiz_score: quizScore,
                risk_level: riskProfile.level,
                eventID: eventId
            });
        }

        // Show in-page success message instead of alert
        showSuccessView(firstName || fullName);
        quoteForm.reset();

    } catch (error) {
        console.error("❌ Error guardando en Firestore:", error);
        // Show in-page error message instead of alert
        showErrorView();
    }

    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
}

// Restart Quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    quizScore = 0;
    riskProfile = {};
    
    resultsSection.style.display = 'none';
    heroSection.style.display = 'flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Log initialization
console.log('Quiz de Evaluación de Cobertura de Salud inicializado');
console.log('Total de preguntas:', quizQuestions.length);