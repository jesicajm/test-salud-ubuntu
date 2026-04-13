const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

// 🔐 Secrets (FORMA CORRECTA V2)
const metaAccessToken = defineSecret("META_ACCESS_TOKEN");
const metaPixelId = defineSecret("META_PIXEL_ID");

// 🔒 Helper hash
function hashData(data) {
  if (!data) return null;
  return crypto.createHash("sha256").update(data.trim().toLowerCase()).digest("hex");
}

exports.sendLeadToMeta = onDocumentCreated(
  {
    document: "leads/{leadId}",
    secrets: [metaAccessToken, metaPixelId], // 🔥 CLAVE
  },
  async (event) => {

    const META_ACCESS_TOKEN = metaAccessToken.value(); // 🔥 CLAVE
    const META_PIXEL_ID = metaPixelId.value();

    console.log("TOKEN:", META_ACCESS_TOKEN);

    const snap = event.data;
    if (!snap) return null;

    const doc = snap.data();

    // 🛑 Anti duplicados
    if (doc.eventSentToMeta === true) {
      console.log("⛔ Ya enviado");
      return null;
    }

    // 🎯 Solo leads calificados
    if (!doc.ingresoMensual || doc.ingresoMensual < 8000000) {
      console.log("ℹ️ No calificado");
      return null;
    }

    try {

      const eventId = doc.eventId || `lead_${event.params.leadId}`;

      const payload = {
        data: [
          {
            event_name: "Lead",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",

            user_data: {
              em: hashData(doc.email),
              ph: hashData(doc.phone),
              fn: hashData(doc.firstName),
              ln: hashData(doc.lastName),
              ct: hashData(doc.city),
              country: hashData("co"),

              client_user_agent: doc.user_agent || null,
              fbp: doc.fbp || null,
              fbc: doc.fbc || null
            },

            custom_data: {
              currency: "COP",
              value: doc.ingresoMensual,
              income_bracket: doc.incomeBracket,
              quiz_score: doc.quizScore,
              risk_level: doc.riskLevel
            }
          }
        ]
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (result.error) {
        console.error("❌ Meta error:", result.error);
        return null;
      }

      console.log("✅ Enviado a Meta");

      await snap.ref.update({
        eventSentToMeta: true,
        metaResponse: result,
        metaSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;

    } catch (error) {
      console.error("🔥 Error:", error);
      return null;
    }
  }
);

/* ============================================================
   📌 ENVIAR LEADS DE SALUD A GOOGLE SHEETS
   🔥 Cuando se crea/actualiza un documento en "leads"
   ============================================================ */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVVDRt4lIU8Q7g6-0QQmrP60xLw2VRFUske5A41ZWV87-p0Ts5-dIfo-aIpuPr9Og/exec";

exports.enviarLeadSaludASheets = onDocumentWritten(
  {
    document: "leads/{leadId}",
    region: "us-central1"
  },
  async (event) => {
    if (!event.data.after.exists) {
      console.log("Documento eliminado, ignorando.");
      return;
    }

    const data = event.data.after.data();
    const leadId = event.params.leadId;

    if (data.sentToSheets) {
      console.log(`Lead ${leadId} ya fue enviado a Sheets.`);
      return;
    }

    const payload = {
      fecha: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
      nombreCompleto: data.fullName || "",
      nombre: data.firstName || "",
      apellido: data.lastName || "",
      email: data.email || "",
      telefono: data.phone || "",
      ciudad: data.city || "",
      ingresoMensual: data.ingresoMensual || 0,
      rangoIngreso: data.incomeBracket || "",
      cualificado: data.isQualified ? "Sí" : "No",
      quizScore: data.quizScore || 0,
      nivelRiesgo: data.riskLevel || "",
      notas: data.notes || "",
      fuente: data.source || "",
      edad: data.quizAnswers?.[1] || "",
      eps: data.quizAnswers?.[3] || "",
      tiempoEspecialista: data.quizAnswers?.[4] || "",
      libertadEleccion: data.quizAnswers?.[5] || "",
      habitacion: data.quizAnswers?.[6] || "",
      gastosHospitalarios: data.quizAnswers?.[7] || "",
      tiempoExamenes: data.quizAnswers?.[8] || "",
      condicionPreexistente: data.quizAnswers?.[9] || "",
      familiares: data.quizAnswers?.[10] || ""
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Lead ${leadId} enviado a Google Sheets.`);
        await event.data.after.ref.update({ sentToSheets: true });
      } else {
        console.error(`❌ Error HTTP ${response.status} al enviar lead ${leadId}.`);
      }
    } catch (error) {
      console.error(`❌ Error enviando lead ${leadId} a Sheets:`, error);
    }
  }
);