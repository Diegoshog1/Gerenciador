"""
Bot do Telegram — Assistente de atendimento do Diego Shogun (@DiegoShogun)

Conversa com clientes no idioma deles, coleta informações sobre o projeto
de tatuagem e notifica Diego quando o cliente está pronto para orçar.

Variáveis de ambiente necessárias:
    TELEGRAM_BOT_TOKEN  — token do bot (obtenha com @BotFather)
    TELEGRAM_OWNER_ID   — seu ID do Telegram (obtenha com @userinfobot)
    ANTHROPIC_API_KEY   — chave da API Anthropic
"""

import os
from anthropic import AsyncAnthropic
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

client = AsyncAnthropic()

SYSTEM_PROMPT = """
You are Maya, Diego Shogun's studio assistant. You manage his messages and help clients figure out their tattoo projects before Diego jumps in.

About Diego (@DiegoShogun on Instagram):
- Brazilian blackwork tattoo artist doing guest spots across Europe
- Style: blackwork + neo-traditional + abstract, heavy geek themes (anime, manga, RPGs, sci-fi, Japanese pop culture)
- Known for: dense fills, strong black/skin contrast, ornamental frames, geek culture references fused with European blackwork aesthetics

Your personality as Maya:
- Warm, direct, genuinely curious about people's tattoo ideas
- You've been around tattoo culture long enough to ask the right questions
- You get excited when someone has a clear concept, especially geek-related ones
- You write like a real person: short messages, natural flow, sometimes a bit casual
- You don't use corporate language, you don't say things like "certainly!" or "great choice!"
- You never say you're an AI or a bot — you're Maya, Diego's assistant

CRITICAL RULE: Always respond in the EXACT same language the client writes in.
- German message → German reply
- French message → French reply
- Italian message → Italian reply
- English message → English reply
- Portuguese message → Portuguese reply
- And so on for any language.

Other rules:
- Never quote prices. Diego handles pricing conversations himself.
- Never confirm specific dates or availability — Diego confirms this.
- Keep replies short: 2-4 sentences, one question at a time.
- Draw out the tattoo concept naturally through conversation, not like filling a form.

Your goal is to understand (through natural conversation):
1. What design/concept they have in mind — be curious, dig into the idea
2. Size and body placement
3. Their timeline — when are they thinking about getting it?

When you have a clear picture of concept + size + placement, add exactly this
on its own line at the very end of your message:
[LEAD_QUALIFIED]

Do NOT add the marker before you understand the concept, size, and placement.
"""

# In-memory state
conversations: dict[int, list] = {}
notified: set[int] = set()

MAX_HISTORY = 30  # messages kept per conversation


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    conversations[user_id] = []
    notified.discard(user_id)
    await update.message.reply_text(
        "Hey! I'm Maya, Diego's assistant. Tell me about the tattoo you have in mind 🖤"
    )


async def cmd_myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando de ajuda para Diego descobrir seu próprio ID do Telegram."""
    await update.message.reply_text(f"Seu Telegram ID: `{update.effective_user.id}`",
                                    parse_mode="Markdown")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    user_id = user.id
    text = update.message.text

    if user_id not in conversations:
        conversations[user_id] = []

    conversations[user_id].append({"role": "user", "content": text})

    # Trunca histórico para não explodir tokens
    if len(conversations[user_id]) > MAX_HISTORY:
        conversations[user_id] = conversations[user_id][-MAX_HISTORY:]

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=conversations[user_id],
    )

    reply = response.content[0].text
    qualified = "[LEAD_QUALIFIED]" in reply
    clean_reply = reply.replace("[LEAD_QUALIFIED]", "").strip()

    conversations[user_id].append({"role": "assistant", "content": clean_reply})

    await update.message.reply_text(clean_reply)

    # Notifica Diego uma única vez por cliente qualificado
    if qualified and user_id not in notified:
        notified.add(user_id)
        await _notify_owner(context, user)


async def _notify_owner(context: ContextTypes.DEFAULT_TYPE, user) -> None:
    owner_id = os.environ.get("TELEGRAM_OWNER_ID")
    if not owner_id:
        return

    user_id = user.id
    user_name = user.first_name or "Cliente"
    username_str = f"@{user.username}" if user.username else f"ID: {user_id}"

    # Monta histórico (apenas mensagens do cliente para ser conciso)
    lines = []
    for msg in conversations.get(user_id, []):
        if msg["role"] == "user":
            lines.append(f"• {msg['content']}")

    history = "\n".join(lines[-10:])  # últimas 10 falas do cliente

    text = (
        f"🔥 *Lead qualificado!*\n\n"
        f"*Cliente:* {user_name} ({username_str})\n\n"
        f"*O que quer:*\n{history}\n\n"
        f"Abre o Telegram e fala direto com ele! 👆"
    )

    try:
        await context.bot.send_message(
            chat_id=int(owner_id),
            text=text[:4000],  # limite do Telegram
            parse_mode="Markdown",
        )
    except Exception as e:
        print(f"Erro ao notificar: {e}")


def main() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        print("\n❌  TELEGRAM_BOT_TOKEN não encontrado.")
        print("    1. Crie um bot com @BotFather no Telegram")
        print("    2. Adicione no .env: TELEGRAM_BOT_TOKEN=seu-token\n")
        return

    owner_id = os.environ.get("TELEGRAM_OWNER_ID")
    if not owner_id:
        print("⚠️   TELEGRAM_OWNER_ID não definido — você não receberá notificações.")
        print("    1. Mande /myid pro bot depois de iniciar")
        print("    2. Adicione no .env: TELEGRAM_OWNER_ID=seu-id\n")

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n❌  ANTHROPIC_API_KEY não encontrada.")
        print("    Adicione no .env: ANTHROPIC_API_KEY=sk-ant-...\n")
        return

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("myid", cmd_myid))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🤖 Bot rodando... Ctrl+C para parar.")
    app.run_polling()


if __name__ == "__main__":
    main()
