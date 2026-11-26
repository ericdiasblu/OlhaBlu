"""Promove ou remove perfil de moderação de uma conta existente.

Uso: python -m app.commands.moderator --email moderador@exemplo.com
"""

import argparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_engine
from app.models import User


def main():
    parser = argparse.ArgumentParser(
        description="Define o perfil de um usuário cadastrado como moderador ou morador."
    )
    parser.add_argument("--email", required=True, help="E-mail da conta cadastrada.")
    parser.add_argument(
        "--demote", action="store_true", help="Retorna o perfil da conta para morador (user)."
    )
    args = parser.parse_args()
    email = args.email.strip().lower()
    target_role = "user" if args.demote else "moderator"

    with Session(get_engine()) as session, session.begin():
        user = session.scalar(select(User).where(User.email == email))
        if user is None:
            parser.error(f"Usuário não encontrado para o e-mail {email}.")
        user.role = target_role

    print(f"Perfil de {email} atualizado para '{target_role}'.")


if __name__ == "__main__":
    main()
