#!/usr/bin/env python3
"""
Gerenciador Financeiro — Diego Shogun
Controle de receitas, despesas e contas a pagar por guest spot.

Uso:
    python financas.py                    # menu interativo
    python financas.py receita            # registrar ganho de sessão
    python financas.py despesa            # registrar despesa
    python financas.py conta              # registrar conta a pagar
    python financas.py relatorio          # relatório geral
    python financas.py relatorio Frankfurt # relatório por guest spot
"""

import os
import sys
import sqlite3
import argparse
from datetime import date, datetime
from pathlib import Path
from typing import Optional


DB_PATH = Path(__file__).parent / "financas.db"


# ─── Banco de dados ──────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS receitas (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                data        TEXT    NOT NULL,
                cidade      TEXT    NOT NULL,
                cliente     TEXT,
                valor       REAL    NOT NULL,
                descricao   TEXT,
                criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS despesas (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                data        TEXT    NOT NULL,
                cidade      TEXT,
                categoria   TEXT    NOT NULL,
                valor       REAL    NOT NULL,
                descricao   TEXT,
                criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS contas_pagar (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                credor      TEXT    NOT NULL,
                descricao   TEXT,
                valor       REAL    NOT NULL,
                vencimento  TEXT    NOT NULL,
                pago        INTEGER NOT NULL DEFAULT 0,
                cidade      TEXT,
                pago_em     TEXT,
                criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)


# ─── Utilitários de entrada ──────────────────────────────────────────────────

def _ask(prompt: str, default: str = "") -> str:
    if default:
        resp = input(f"  {prompt} [{default}]: ").strip()
        return resp if resp else default
    return input(f"  {prompt}: ").strip()


def _ask_float(prompt: str, default: Optional[float] = None) -> float:
    default_str = f"{default:.2f}" if default is not None else ""
    while True:
        raw = _ask(prompt, default_str)
        raw = raw.replace(",", ".")
        try:
            return float(raw)
        except ValueError:
            print("    ⚠️  Digite um valor numérico válido (ex: 150.00 ou 150,00)")


def _ask_date(prompt: str) -> str:
    today = date.today().isoformat()
    while True:
        raw = _ask(prompt, today)
        try:
            datetime.strptime(raw, "%Y-%m-%d")
            return raw
        except ValueError:
            print("    ⚠️  Formato: AAAA-MM-DD (ex: 2025-06-15)")


def _header(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


# ─── Registros ──────────────────────────────────────────────────────────────

def registrar_receita() -> None:
    _header("💰 REGISTRAR GANHO DE SESSÃO")
    data      = _ask_date("Data da sessão (AAAA-MM-DD)")
    cidade    = _ask("Cidade do guest spot", "Frankfurt")
    cliente   = _ask("Nome do cliente (opcional)", "") or None
    valor     = _ask_float("Valor recebido (€)")
    descricao = _ask("Descrição / estilo (opcional)", "") or None

    with get_db() as conn:
        conn.execute(
            "INSERT INTO receitas (data, cidade, cliente, valor, descricao) VALUES (?,?,?,?,?)",
            (data, cidade, cliente, valor, descricao),
        )

    print(f"\n  ✅ Receita de €{valor:.2f} registrada em {cidade} ({data}).")


def registrar_despesa() -> None:
    categorias = ["Voo", "Hotel", "Alimentação", "Material", "Transporte", "Equipamento", "Outro"]
    _header("📤 REGISTRAR DESPESA")
    data = _ask_date("Data da despesa (AAAA-MM-DD)")

    print("  Categorias:")
    for i, c in enumerate(categorias, 1):
        print(f"    {i}. {c}")
    while True:
        raw = _ask("Categoria (número ou nome)", "Outro")
        if raw.isdigit() and 1 <= int(raw) <= len(categorias):
            categoria = categorias[int(raw) - 1]
            break
        elif raw in categorias:
            categoria = raw
            break
        else:
            categoria = raw
            break

    cidade    = _ask("Cidade relacionada (opcional)", "") or None
    valor     = _ask_float("Valor (€)")
    descricao = _ask("Descrição (opcional)", "") or None

    with get_db() as conn:
        conn.execute(
            "INSERT INTO despesas (data, cidade, categoria, valor, descricao) VALUES (?,?,?,?,?)",
            (data, cidade, categoria, valor, descricao),
        )

    print(f"\n  ✅ Despesa de €{valor:.2f} ({categoria}) registrada.")


def registrar_conta_pagar() -> None:
    _header("📋 REGISTRAR CONTA A PAGAR")
    credor     = _ask("Credor / fornecedor")
    descricao  = _ask("Descrição (opcional)", "") or None
    valor      = _ask_float("Valor (€)")
    vencimento = _ask_date("Vencimento (AAAA-MM-DD)")
    cidade     = _ask("Cidade relacionada (opcional)", "") or None

    with get_db() as conn:
        conn.execute(
            "INSERT INTO contas_pagar (credor, descricao, valor, vencimento, cidade) VALUES (?,?,?,?,?)",
            (credor, descricao, valor, vencimento, cidade),
        )

    print(f"\n  ✅ Conta de €{valor:.2f} com {credor} registrada (vence {vencimento}).")


def marcar_conta_paga() -> None:
    _header("✅ MARCAR CONTA COMO PAGA")

    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, credor, descricao, valor, vencimento FROM contas_pagar "
            "WHERE pago = 0 ORDER BY vencimento"
        ).fetchall()

    if not rows:
        print("\n  Nenhuma conta em aberto.")
        return

    print()
    for r in rows:
        desc = f" — {r['descricao']}" if r['descricao'] else ""
        print(f"  [{r['id']}] {r['credor']}{desc}  €{r['valor']:.2f}  vence {r['vencimento']}")

    raw = _ask("\n  ID da conta paga")
    try:
        conta_id = int(raw)
    except ValueError:
        print("  ⚠️  ID inválido.")
        return

    hoje = date.today().isoformat()
    with get_db() as conn:
        updated = conn.execute(
            "UPDATE contas_pagar SET pago = 1, pago_em = ? WHERE id = ? AND pago = 0",
            (hoje, conta_id),
        ).rowcount

    if updated:
        print(f"\n  ✅ Conta #{conta_id} marcada como paga.")
    else:
        print("  ⚠️  Conta não encontrada ou já paga.")


# ─── Relatórios ──────────────────────────────────────────────────────────────

def _fmt(valor: float) -> str:
    return f"€{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def relatorio_geral(cidade_filtro: Optional[str] = None) -> None:
    filtro_sql = "WHERE cidade = ?" if cidade_filtro else ""
    params     = (cidade_filtro,) if cidade_filtro else ()

    titulo = f"RELATÓRIO — {cidade_filtro.upper()}" if cidade_filtro else "RELATÓRIO GERAL"
    _header(f"📊 {titulo}")

    with get_db() as conn:
        # Receitas
        rec = conn.execute(
            f"SELECT SUM(valor) as total, COUNT(*) as qtd FROM receitas {filtro_sql}", params
        ).fetchone()
        total_rec = rec["total"] or 0.0
        qtd_rec   = rec["qtd"] or 0

        # Ticket médio
        ticket = total_rec / qtd_rec if qtd_rec else 0.0

        # Despesas
        desp = conn.execute(
            f"SELECT SUM(valor) as total, COUNT(*) as qtd FROM despesas {filtro_sql}", params
        ).fetchone()
        total_desp = desp["total"] or 0.0

        # Despesas por categoria
        cats = conn.execute(
            f"SELECT categoria, SUM(valor) as total FROM despesas {filtro_sql} "
            f"GROUP BY categoria ORDER BY total DESC", params
        ).fetchall()

        # Contas a pagar (em aberto)
        cp_filtro = "WHERE pago = 0 AND cidade = ?" if cidade_filtro else "WHERE pago = 0"
        cp_params = (cidade_filtro,) if cidade_filtro else ()
        cp = conn.execute(
            f"SELECT SUM(valor) as total, COUNT(*) as qtd FROM contas_pagar {cp_filtro}", cp_params
        ).fetchone()
        total_cp  = cp["total"] or 0.0
        qtd_cp    = cp["qtd"] or 0

        # Contas vencidas
        hoje = date.today().isoformat()
        cp_venc_filtro = ("WHERE pago = 0 AND vencimento < ? AND cidade = ?"
                          if cidade_filtro else "WHERE pago = 0 AND vencimento < ?")
        cp_venc_params = (hoje, cidade_filtro) if cidade_filtro else (hoje,)
        cp_venc = conn.execute(
            f"SELECT SUM(valor) as total, COUNT(*) as qtd FROM contas_pagar {cp_venc_filtro}",
            cp_venc_params,
        ).fetchone()
        total_vencido = cp_venc["total"] or 0.0
        qtd_vencido   = cp_venc["qtd"] or 0

        # Últimas receitas
        ultimas = conn.execute(
            f"SELECT data, cidade, cliente, valor, descricao FROM receitas {filtro_sql} "
            f"ORDER BY data DESC LIMIT 10", params
        ).fetchall()

        # Últimas contas em aberto
        contas_abertas = conn.execute(
            f"SELECT credor, descricao, valor, vencimento FROM contas_pagar {cp_filtro} "
            f"ORDER BY vencimento LIMIT 10", cp_params
        ).fetchall()

    lucro = total_rec - total_desp

    print(f"\n  {'RECEITAS':.<40} {_fmt(total_rec):>12}")
    print(f"  {'Sessões registradas':.<40} {qtd_rec:>12}")
    print(f"  {'Ticket médio por sessão':.<40} {_fmt(ticket):>12}")
    print()
    print(f"  {'DESPESAS':.<40} {_fmt(total_desp):>12}")
    for c in cats:
        print(f"    {'↳ ' + c['categoria']:.<38} {_fmt(c['total']):>12}")
    print()
    print(f"  {'LUCRO LÍQUIDO (receitas − despesas)':.<40} {_fmt(lucro):>12}")
    print()
    print(f"  {'CONTAS A PAGAR (em aberto)':.<40} {_fmt(total_cp):>12}  ({qtd_cp} conta(s))")
    if total_vencido > 0:
        print(f"  {'⚠️  Contas VENCIDAS':.<40} {_fmt(total_vencido):>12}  ({qtd_vencido} conta(s))")

    if ultimas:
        print(f"\n  {'─' * 58}")
        print("  Últimas sessões:")
        for r in ultimas:
            cliente = r['cliente'] or '—'
            desc    = f" ({r['descricao']})" if r['descricao'] else ""
            print(f"    {r['data']}  {r['cidade']:<14} {cliente:<18} {_fmt(r['valor'])}{desc}")

    if contas_abertas:
        print(f"\n  {'─' * 58}")
        print("  Contas em aberto:")
        for c in contas_abertas:
            desc = f" — {c['descricao']}" if c['descricao'] else ""
            venc = c['vencimento']
            alerta = " ⚠️" if venc < date.today().isoformat() else ""
            print(f"    {venc}{alerta}  {c['credor']}{desc}  {_fmt(c['valor'])}")

    print()


def relatorio_por_cidade() -> None:
    _header("🌍 RESUMO POR GUEST SPOT")

    with get_db() as conn:
        cidades = conn.execute(
            "SELECT cidade FROM receitas GROUP BY cidade "
            "UNION SELECT cidade FROM despesas WHERE cidade IS NOT NULL GROUP BY cidade "
            "ORDER BY cidade"
        ).fetchall()

    if not cidades:
        print("\n  Nenhum dado registrado.")
        return

    with get_db() as conn:
        for row in cidades:
            cidade = row[0]
            rec  = conn.execute("SELECT SUM(valor) as t, COUNT(*) as q FROM receitas WHERE cidade=?", (cidade,)).fetchone()
            desp = conn.execute("SELECT SUM(valor) as t FROM despesas WHERE cidade=?", (cidade,)).fetchone()
            t_rec  = rec["t"] or 0.0
            t_desp = desp["t"] or 0.0
            lucro  = t_rec - t_desp
            ticket = t_rec / rec["q"] if rec["q"] else 0.0
            print(f"\n  {cidade.upper()}")
            print(f"    Receitas: {_fmt(t_rec)}  ({rec['q']} sessões, ticket médio {_fmt(ticket)})")
            print(f"    Despesas: {_fmt(t_desp)}")
            print(f"    Lucro:    {_fmt(lucro)}")

    print()


# ─── Menu interativo ─────────────────────────────────────────────────────────

MENU = """
╔══════════════════════════════════════════════════════════════╗
║         DIEGO SHOGUN — GERENCIADOR FINANCEIRO               ║
╚══════════════════════════════════════════════════════════════╝

  1. Registrar ganho de sessão
  2. Registrar despesa
  3. Registrar conta a pagar
  4. Marcar conta como paga
  5. Relatório geral
  6. Relatório por cidade / guest spot
  7. Relatório de uma cidade específica
  0. Sair
"""


def menu_interativo() -> None:
    init_db()
    while True:
        print(MENU)
        op = input("  Opção: ").strip()
        if op == "1":
            registrar_receita()
        elif op == "2":
            registrar_despesa()
        elif op == "3":
            registrar_conta_pagar()
        elif op == "4":
            marcar_conta_paga()
        elif op == "5":
            relatorio_geral()
        elif op == "6":
            relatorio_por_cidade()
        elif op == "7":
            cidade = _ask("\n  Cidade").strip()
            relatorio_geral(cidade)
        elif op == "0":
            print("\n  Até logo!\n")
            break
        else:
            print("  Opção inválida.")


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    init_db()

    parser = argparse.ArgumentParser(
        description="Gerenciador financeiro do Diego Shogun",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "comando",
        nargs="?",
        choices=["receita", "despesa", "conta", "pagar", "relatorio", "cidades"],
        help="Comando direto (omita para menu interativo)",
    )
    parser.add_argument("cidade", nargs="?", help="Filtrar relatório por cidade")
    args = parser.parse_args()

    if args.comando is None:
        menu_interativo()
    elif args.comando == "receita":
        registrar_receita()
    elif args.comando == "despesa":
        registrar_despesa()
    elif args.comando == "conta":
        registrar_conta_pagar()
    elif args.comando == "pagar":
        marcar_conta_paga()
    elif args.comando == "relatorio":
        if args.cidade:
            relatorio_geral(args.cidade)
        else:
            relatorio_geral()
    elif args.comando == "cidades":
        relatorio_por_cidade()


if __name__ == "__main__":
    main()
