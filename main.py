#!/usr/bin/env python3
"""
DiegoShogun Marketing Agent Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Equipe de 4 agentes especializados para preencher agenda em guest spots europeus.

Uso:
    python main.py                  # modo interativo
    python main.py --city Frankfurt # pula a pergunta da cidade
"""

import os
import sys
import argparse


# Mapa cidade → idioma (auto-detecção)
CITY_LANGUAGE_MAP = {
    "frankfurt": ("de", "Alemão/German"),
    "berlin":    ("de", "Alemão/German"),
    "hamburg":   ("de", "Alemão/German"),
    "munich":    ("de", "Alemão/German"),
    "münchen":   ("de", "Alemão/German"),
    "köln":      ("de", "Alemão/German"),
    "cologne":   ("de", "Alemão/German"),
    "paris":     ("fr", "Francês/French"),
    "lyon":      ("fr", "Francês/French"),
    "madrid":    ("es", "Espanhol/Spanish"),
    "barcelona": ("es", "Espanhol/Spanish"),
    "london":    ("en", "Inglês/English"),
    "amsterdam": ("nl", "Holandês/Dutch"),
    "rome":      ("it", "Italiano/Italian"),
    "milan":     ("it", "Italiano/Italian"),
    "zurich":    ("de", "Alemão/German"),
    "vienna":    ("de", "Alemão/German"),
    "wien":      ("de", "Alemão/German"),
    "lisbon":    ("pt", "Português/Portuguese"),
    "porto":     ("pt", "Português/Portuguese"),
    "brussels":  ("fr", "Francês/French"),
    "stockholm": ("sv", "Sueco/Swedish"),
    "oslo":      ("no", "Norueguês/Norwegian"),
    "copenhagen":("da", "Dinamarquês/Danish"),
    "warsaw":    ("pl", "Polonês/Polish"),
    "prague":    ("cs", "Tcheco/Czech"),
}


def _header():
    print("""
╔══════════════════════════════════════════════════════════════╗
║        DIEGO SHOGUN — MARKETING AGENT TEAM                  ║
║        @DiegoShogun | Blackwork Geek | Guest Spots EU       ║
╚══════════════════════════════════════════════════════════════╝
""")


def _detect_language(city: str) -> tuple[str, str]:
    """Retorna (lang_code, lang_name) baseado na cidade. Padrão: inglês."""
    return CITY_LANGUAGE_MAP.get(city.lower(), ("en", "Inglês/English"))


def _ask(prompt: str, default: str = "") -> str:
    """Pergunta com valor padrão opcional."""
    if default:
        response = input(f"{prompt} [{default}]: ").strip()
        return response if response else default
    return input(f"{prompt}: ").strip()


def collect_guest_spot_info(city_arg: str | None = None) -> "GuestSpotContext":
    from agents import GuestSpotContext

    _header()
    print("Preencha os dados do guest spot para gerar o conteúdo:\n")

    # Cidade
    if city_arg:
        city = city_arg
        print(f"🏙️  Cidade: {city}")
    else:
        city = _ask("🏙️  Cidade do guest spot", "Frankfurt")

    # Auto-detecta idioma
    lang_code, lang_name = _detect_language(city)
    print(f"   ↳ Idioma detectado: {lang_name}")

    # Datas
    start_date = _ask("📅  Data de início (ex: 15 maio / May 15)", "em breve")
    end_date   = _ask("📅  Data de término (Enter para pular)", "")

    # Estúdio
    studio = _ask("🏠  Nome do estúdio (Enter para pular)", "") or None

    # Slots
    slots_raw = _ask("💉  Slots disponíveis", "5")
    try:
        slots = int(slots_raw)
    except ValueError:
        slots = 5

    print()
    return GuestSpotContext(
        city=city,
        lang_code=lang_code,
        lang_name=lang_name,
        start_date=start_date,
        end_date=end_date,
        studio_name=studio,
        available_slots=slots,
    )


def main():
    # Carrega .env se existir (dev local)
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    # Verifica API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n❌  ANTHROPIC_API_KEY não encontrada.")
        print("    Opção 1: crie um arquivo .env com  ANTHROPIC_API_KEY=sk-ant-...")
        print("    Opção 2: exporte no terminal:      export ANTHROPIC_API_KEY='sk-ant-...'\n")
        sys.exit(1)

    # Argumentos opcionais
    parser = argparse.ArgumentParser(description="DiegoShogun Marketing Agent Team")
    parser.add_argument("--city", help="Cidade do guest spot (pula a pergunta interativa)")
    args = parser.parse_args()

    # Coleta info e executa os agentes
    ctx = collect_guest_spot_info(city_arg=args.city)

    print("⏳  Iniciando equipe de agentes...\n")
    print("    Agente 1 — Estrategista (analisa mercado local)")
    print("    Agente 2 — Conteúdo (posts Instagram bilíngues)")
    print("    Agente 3 — Urgência (posts de disponibilidade)")
    print("    Agente 4 — DM (scripts de resposta para o inbox)\n")

    from agents import run_all_agents
    run_all_agents(ctx)


if __name__ == "__main__":
    main()
