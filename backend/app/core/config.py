from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "AEX | Ocorrências urbanas"
    app_env: Literal["development", "production"] = "development"
    db_host: str = "127.0.0.1"
    db_port: int = Field(default=3306, ge=1, le=65535)
    db_name: str = "ocorrencias"
    db_user: str = "ocorrencias"
    db_password: SecretStr = SecretStr("")
    db_connect_timeout_seconds: int = Field(default=3, ge=1, le=15)
    occurrence_ttl_hours: int = Field(default=48, ge=1)
    session_ttl_days: int = Field(default=14, ge=1, le=90)
    admin_email: str = ""
    moderator_emails: str = ""

    @property
    def principal_admin_email(self) -> str:
        return self.admin_email.strip().lower()

    @property
    def moderator_email_set(self) -> set[str]:
        emails = {
            item.strip().lower()
            for item in self.moderator_emails.split(",")
            if item.strip()
        }
        if self.principal_admin_email:
            emails.add(self.principal_admin_email)
        return emails

    @property
    def database_configured(self) -> bool:
        return bool(self.db_password.get_secret_value())

    @property
    def database_url(self) -> URL:
        return URL.create(
            "mysql+pymysql",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            query={"charset": "utf8mb4"},
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
