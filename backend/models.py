from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    setor = Column(String, default="Geral")
    cargo = Column(String, default="Membro")
    template_base64 = Column(String, nullable=True)
    data_cadastro = Column(DateTime, default=datetime.datetime.utcnow)

    registros = relationship("RegistroPonto", back_populates="usuario", cascade="all, delete-orphan")

class RegistroPonto(Base):
    __tablename__ = "registros_ponto"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    data_registro = Column(DateTime, default=datetime.datetime.utcnow) # Guarda a data
    hora_entrada = Column(DateTime, nullable=True)
    hora_saida = Column(DateTime, nullable=True)

    usuario = relationship("Usuario", back_populates="registros")
