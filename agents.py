"""
Equipe de agentes de marketing — DiegoShogun (@DiegoShogun)
Cada agente tem uma função específica para preencher a agenda em guest spots.

Usa prompt caching no perfil do artista para economizar tokens entre chamadas.
"""

import anthropic
from dataclasses import dataclass, field
from typing import Optional

client = anthropic.Anthropic()

# Perfil do artista — cacheado em todas as chamadas (economiza tokens)
ARTIST_PROFILE = """
# Diego Shogun — Perfil do Artista (uso interno dos agentes)

**Instagram:** @DiegoShogun
**Estilo:** Blackwork neo-tradicional + abstrato + temática geek

Características visuais:
- Blackwork: preenchimento denso, linhas marcadas, contraste forte preto/pele
- Neo-tradicional: composição sólida, flores e ornamentos estilizados, molduras
- Abstrato: geometria, texturas orgânicas, formas que escapam do convencional
- Temática geek: anime clássico e atual, mangá, RPGs, sci-fi, fantasia, cultura pop japonesa

**Origem:** Brasil — faz tour pela Europa em guest spots
**Público:** Colecionadores sérios de tattoo, fãs de geek culture, amantes de blackwork pesado
**Tom de voz:** Artístico, direto e autêntico — nunca corporativo, nunca desesperado
**Diferencial:** Funde a estética densa do blackwork europeu com sensibilidade visual de anime/mangá
**Handle:** Sempre mencionar @DiegoShogun nos posts

Regras de conteúdo:
- Não usar emojis em excesso — no máximo 2-3 por post
- Não usar linguagem genérica de tatuador ("book now!", "dm for info" sem contexto)
- Posts devem soar como o artista, não como uma agência
- Call-to-action sempre específico e humano
"""


@dataclass
class GuestSpotContext:
    city: str
    lang_code: str       # "de", "en", "fr", "es", "it", "nl"
    lang_name: str       # "Alemão", "Inglês", "Francês" ...
    start_date: str
    end_date: str = ""
    studio_name: Optional[str] = None
    available_slots: int = 5

    @property
    def period_str(self) -> str:
        if self.end_date:
            return f"{self.start_date} — {self.end_date}"
        return f"a partir de {self.start_date}"

    @property
    def studio_str(self) -> str:
        return self.studio_name or "estúdio local (a confirmar)"


# ─── Utilitários internos ────────────────────────────────────────────────────

def _cached_system(role_context: str) -> list:
    """Monta system prompt com caching no perfil do artista."""
    return [
        {
            "type": "text",
            "text": ARTIST_PROFILE,
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": role_context,
        },
    ]


def _stream(label: str, **kwargs) -> str:
    """Roda uma chamada ao Claude com streaming e imprime o resultado."""
    print(f"\n{'─' * 62}")
    print(f"  {label}")
    print('─' * 62)

    with client.messages.stream(**kwargs) as stream:
        full_text = ""
        for chunk in stream.text_stream:
            print(chunk, end="", flush=True)
            full_text += chunk
        print()  # quebra de linha final

    return full_text


# ─── Agente 1: Estrategista ──────────────────────────────────────────────────

def run_strategist(ctx: GuestSpotContext) -> str:
    """
    Analisa o mercado local e cria o plano estratégico completo para o guest spot.
    Usa claude-opus-4-7 com adaptive thinking — o único agente que realmente "pensa".
    """
    role = f"""Você é o Agente Estrategista da equipe de marketing do Diego Shogun.

Sua função: criar o plano de conteúdo para o guest spot em {ctx.city}.

Entregue:
1. Calendário de posts — o que postar, quando (dias antes + durante o guest)
2. Ângulos de mensagem que ressoam com o público de {ctx.city}
3. Estratégia de hashtags: local (#{ctx.city.lower()}tattoo etc.) + estilo + geek culture
4. Táticas concretas para preencher {ctx.available_slots} slots sem parecer desesperado
5. Uma nota cultural sobre {ctx.city} relevante para o tom dos posts

Seja específico e prático. Nada de teoria — apenas o que funciona para um artista solo."""

    user_msg = f"""Crie o plano estratégico para este guest spot:

Cidade: {ctx.city}
Idioma local: {ctx.lang_name}
Período: {ctx.period_str}
Estúdio: {ctx.studio_str}
Slots disponíveis: {ctx.available_slots}"""

    print("\n  ⏳ Estrategista analisando o mercado de {ctx.city}...".format(ctx=ctx))

    return _stream(
        "🧠 AGENTE ESTRATEGISTA — Plano de Conteúdo",
        model="claude-opus-4-7",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=_cached_system(role),
        messages=[{"role": "user", "content": user_msg}],
    )


# ─── Agente 2: Conteúdo Instagram ───────────────────────────────────────────

def run_content_agent(ctx: GuestSpotContext, strategy: str) -> str:
    """
    Cria posts completos para o Instagram — bilíngue (idioma local + inglês).
    """
    role = f"""Você é o Agente de Conteúdo do Diego Shogun, especialista em copy para tatuadores.

Crie posts prontos para copiar e colar no Instagram.
Idioma: {ctx.lang_name} + inglês (bilíngue separado por linha em branco).
Tom: artístico, humano, com personalidade de artista — não de agência.

Formato de cada post:
---
🇩🇪 [Versão no idioma local]

🇬🇧 [Versão em inglês]

#hashtags (20-25, mistura de local + estilo + geek)
---"""

    user_msg = f"""Crie 3 posts completos para o Instagram.

Cidade: {ctx.city} | Estúdio: {ctx.studio_str}
Período: {ctx.period_str} | Slots: {ctx.available_slots}

POST 1 — ANÚNCIO DE CHEGADA
Postar 5-7 dias antes. Tom: emocionante mas controlado.
"Diego Shogun está vindo para {ctx.city}."

POST 2 — SHOWCASE DE PORTFÓLIO
Postar 3-4 dias antes. Foco no estilo único (blackwork geek).
Deve fazer o público pensar: "Isso é exatamente o que eu quero."

POST 3 — CONEXÃO CULTURAL GEEK
Postar 1-2 dias antes. Referência a algo de geek culture que conecta com {ctx.city}.
(Ex: evento local, série popular, jogo recente — o que for relevante)

Estratégia de referência do Estrategista:
{strategy[:600]}"""

    return _stream(
        "✍️  AGENTE DE CONTEÚDO — Posts Instagram",
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=_cached_system(role),
        messages=[{"role": "user", "content": user_msg}],
    )


# ─── Agente 3: Urgência e Disponibilidade ───────────────────────────────────

def run_urgency_agent(ctx: GuestSpotContext) -> str:
    """
    Cria posts de escassez/urgência para preencher os slots restantes.
    """
    role = f"""Você é o Agente de Urgência do Diego Shogun.

Especialidade: criar posts que vendem slots sem soar desesperado.
Use escassez genuína — os slots são realmente limitados.
Tom: confiante, exclusivo. Um artista que sabe o valor do próprio trabalho.

Idioma: {ctx.lang_name} + inglês."""

    user_msg = f"""Crie 4 posts de urgência/disponibilidade para {ctx.city}.

Período: {ctx.period_str} | Slots totais: {ctx.available_slots}
Estúdio: {ctx.studio_str}

POST 1 — ABERTURA DE AGENDA
Anunciando que a agenda está aberta. Tom: exclusivo, não ansioso.
Postar junto com o anúncio de chegada.

POST 2 — CONTAGEM REGRESSIVA DE SLOTS
Para postar quando restarem 2-3 slots. Ex: "3 of {ctx.available_slots} slots booked."
Cria urgência real baseada em fato.

POST 3 — FLASH DISPONÍVEL
Design(s) de blackwork geek disponíveis para sessão no mesmo dia (walk-in).
Deve descrever vagamente o tipo de peça disponível (sem revelar tudo).

POST 4 — ÚLTIMO AVISO
Para o penúltimo/último dia. Urgência máxima, tom profissional.
"Último dia em {ctx.city}."

Cada post deve ter call-to-action direto para o DM."""

    return _stream(
        "⚡ AGENTE DE URGÊNCIA — Posts de Disponibilidade",
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=_cached_system(role),
        messages=[{"role": "user", "content": user_msg}],
    )


# ─── Agente 4: Scripts de DM ─────────────────────────────────────────────────

def run_dm_agent(ctx: GuestSpotContext) -> str:
    """
    Cria templates de resposta para o inbox — convertem interesse em agendamento.
    """
    role = f"""Você é o Agente de DM do Diego Shogun.

Especialidade: converter interesse em inbox em agendamentos confirmados.
Os scripts devem soar como o Diego respondendo — humano, direto, sem template robótico.
Idioma: {ctx.lang_name} (principal) + inglês.

Use [COLCHETES] para indicar onde personalizar."""

    user_msg = f"""Crie 5 scripts de resposta para o inbox do guest em {ctx.city}.

Período: {ctx.period_str} | Slots: {ctx.available_slots}
Estúdio: {ctx.studio_str}

SCRIPT 1 — CONSULTA DE PREÇO
Quando perguntam: "quanto custa?" / "what's the price?"
Resposta que explica o valor sem assustar, move para o agendamento.

SCRIPT 2 — "AINDA TEM VAGA?"
Resposta rápida para quem consulta disponibilidade.
Se ainda tiver slot: confirma e pede referência de design.
Se não tiver: coloca em lista de espera / indica próximo guest.

SCRIPT 3 — CONSULTA DE DESIGN GEEK ESPECÍFICO
Quando pedem: "você faz [personagem/franquia específica]?"
Resposta que valida o pedido e qualifica se encaixa no estilo.

SCRIPT 4 — FOLLOW-UP PARA QUEM SUMIU
Para quem demonstrou interesse mas parou de responder há 2-3 dias.
Tom: casual, não ansioso. Apenas um lembrete gentil.

SCRIPT 5 — CONFIRMAÇÃO DE AGENDAMENTO
Mensagem final confirmando data/hora/estúdio e o que o cliente precisa saber."""

    return _stream(
        "💬 AGENTE DE DM — Scripts para o Inbox",
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=_cached_system(role),
        messages=[{"role": "user", "content": user_msg}],
    )


# ─── Orquestrador ────────────────────────────────────────────────────────────

def run_all_agents(ctx: GuestSpotContext) -> None:
    """Executa a equipe completa em sequência."""
    print(f"\n{'=' * 62}")
    print(f"  🎯 Guest Spot: {ctx.city}  |  {ctx.period_str}")
    print(f"  📱 @DiegoShogun  |  {ctx.available_slots} slots disponíveis")
    print(f"{'=' * 62}")

    # Estrategista primeiro — output alimenta o agente de conteúdo
    strategy = run_strategist(ctx)
    run_content_agent(ctx, strategy)
    run_urgency_agent(ctx)
    run_dm_agent(ctx)

    print(f"\n{'=' * 62}")
    print("  ✅ Conteúdo gerado! Copie o que precisar acima.")
    print("  💡 Dica: salve os posts em notas por data de publicação.")
    print(f"{'=' * 62}\n")
