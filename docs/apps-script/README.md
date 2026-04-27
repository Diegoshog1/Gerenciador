# Apps Script — booking → planilha

Endpoint Google Apps Script que recebe os pedidos da landing e grava numa Google Sheet.

## Setup (5 min)

1. **Criar a planilha**
   - Vai no [Google Sheets](https://sheets.new/), cria uma planilha (ex: `Bookings — Diego Shogun`).
   - Copia a URL inteira (`https://docs.google.com/spreadsheets/d/XXXX/edit`).

2. **Criar o Apps Script**
   - Abre [script.google.com](https://script.google.com/) → **Novo projeto**.
   - Apaga o conteúdo do `Code.gs` que aparece e cola o conteúdo de `Code.gs` deste repo.
   - No topo do arquivo, edita:
     - `SHEET_URL` → cola a URL da planilha do passo 1
     - `NOTIFY_EMAIL` → (opcional) teu e-mail pra receber notificação a cada pedido

3. **Implantar como Web App**
   - **Implantar** → **Nova implantação**
   - Tipo: ⚙️ **App da Web**
   - Configuração:
     - Executar como: **Eu mesmo**
     - Quem pode acessar: **Qualquer pessoa**
   - Clica **Implantar**, autoriza com a tua conta Google.
   - Copia a **URL do app da Web** (termina em `/exec`).

4. **Plugar na landing**
   - Abre `docs/assets/js/main.js`
   - Cola a URL em `GOOGLE_SCRIPT_URL`.
   - Faz commit e push.

## Testar

- Abre a landing, preenche o form de teste e envia.
- Verifica se apareceu uma linha na planilha.
- Se algo falhar, abre o console do navegador (F12) — a resposta do Apps Script vem como JSON.

## Alterar campos depois

Se você adicionar/remover campos no form da landing, atualize a constante `FIELDS` no `Code.gs` na mesma ordem que você quer ver na planilha. Os campos extras enviados pelo form que não estão em `FIELDS` são ignorados.
