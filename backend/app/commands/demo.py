"""Carga opcional e identificada. Executar: python -m app.commands.demo --confirm-simulated."""

import argparse
from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_engine
from app.models import Occurrence

DEMO_IDS = [
    "00000000-0000-4000-8000-000000000001",
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003",
]


def main():
    parser = argparse.ArgumentParser(
        description="Gerencia somente os três registros simulados da base."
    )
    parser.add_argument("--confirm-simulated", action="store_true", required=True)
    parser.add_argument("--remove", action="store_true")
    args = parser.parse_args()
    if get_settings().app_env != "development":
        parser.error("A carga de demonstração é permitida somente em development.")
    now = datetime.now(UTC).replace(tzinfo=None)
    with Session(get_engine()) as session, session.begin():
        session.execute(
            delete(Occurrence).where(Occurrence.id.in_(DEMO_IDS), Occurrence.is_simulated.is_(True))
        )
        if not args.remove:
            for index, (type_id, lat, lng, description) in enumerate(
                [
                    (
                        1,
                        -26.9194,
                        -49.0661,
                        "SIMULAÇÃO: exemplo de relato de alagamento para desenvolvimento.",
                    ),
                    (
                        3,
                        -26.9124,
                        -49.0751,
                        "SIMULAÇÃO: exemplo de árvore caída para desenvolvimento.",
                    ),
                    (2, -26.9250, -49.0590, "SIMULAÇÃO: exemplo de acidente para desenvolvimento."),
                ]
            ):
                session.add(
                    Occurrence(
                        id=DEMO_IDS[index],
                        type_id=type_id,
                        description=description,
                        latitude=lat,
                        longitude=lng,
                        status="active",
                        moderation_status="approved",
                        source="community",
                        is_simulated=True,
                        created_at=now,
                        updated_at=now,
                        published_at=now,
                        last_confirmed_at=now,
                    )
                )
    print(
        "Registros simulados removidos." if args.remove else "Três registros SIMULADOS preparados."
    )


if __name__ == "__main__":
    main()
