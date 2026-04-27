/**
 * Diego Shogun · Booking endpoint
 * ─────────────────────────────────────────────────────────────
 * Recebe um POST JSON do form da landing e grava numa planilha.
 *
 * Como usar:
 *  1. Abra https://script.google.com/ → Novo projeto
 *  2. Cole este arquivo inteiro no editor (substituindo o conteúdo)
 *  3. Crie uma planilha no Google Sheets e copie a URL — cole em SHEET_URL abaixo
 *  4. (opcional) ajuste SHEET_NAME para a aba que vai receber os dados
 *  5. Implantar → Nova implantação → Tipo: "App da Web"
 *       Executar como: Eu mesmo
 *       Quem pode acessar: Qualquer pessoa
 *  6. Copie a URL gerada (termina em /exec) e cole em GOOGLE_SCRIPT_URL no
 *     arquivo web/assets/js/main.js
 */

// ↓↓↓ EDITE AQUI ↓↓↓
const SHEET_URL  = "https://docs.google.com/spreadsheets/d/1-ULGGm8iNEhKdKy1SDuyXbZ8Hf3eDqzIKKAGrNbc7qA/edit";
const SHEET_NAME = "Bookings";      // nome da aba (será criada se não existir)
const NOTIFY_EMAIL = "";            // (opcional) seu e-mail pra notificação
// ↑↑↑ EDITE AQUI ↑↑↑

const FIELDS = [
  "timestamp_iso",
  "nome",
  "idade",
  "whatsapp",
  "instagram",
  "email",
  "estilo",
  "parte_do_corpo",
  "tamanho",
  "ideia",
  "referencias",
  "orcamento",
  "consent",
  "url",
  "user_agent",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();
    ensureHeader_(sheet);

    const row = FIELDS.map(k => data[k] || "");
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      try {
        const subject = `[Diego Shogun] Novo pedido — ${data.nome || "sem nome"}`;
        const body = FIELDS.map(k => `${k}: ${data[k] || "-"}`).join("\n");
        MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
      } catch (mailErr) {
        console.warn("Falha ao notificar email:", mailErr);
      }
    }

    return jsonOut_({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonOut_({ ok: false, error: String(err) }, 500);
  }
}

// GET serve só pra você abrir a URL no navegador e ver "ok" (saúde do endpoint)
function doGet() {
  return jsonOut_({ ok: true, service: "diegoshogun-booking" });
}

function getSheet_() {
  if (!SHEET_URL) throw new Error("SHEET_URL não configurada no Code.gs");
  const ss = SpreadsheetApp.openByUrl(SHEET_URL);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS);
    sheet.setFrozenRows(1);
    const range = sheet.getRange(1, 1, 1, FIELDS.length);
    range.setFontWeight("bold");
  }
}

function jsonOut_(obj, _status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
