from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BiometriaRegistroPayload(BaseModel):
    usuario_id: str # String no payload, convertido para int se necessario ou podemos usar string
    nome: str
    template_base64: str

class RegistroResponse(BaseModel):
    success: bool
    mensagem: str
    tipo: Optional[str] = None # "Entrada" ou "Saida"

class UsuarioBase(BaseModel):
    nome: str
    setor: Optional[str] = "Geral"
    cargo: Optional[str] = "Membro"

class UsuarioCreate(UsuarioBase):
    id: Optional[int] = None # Se omitido, auto-incrementa
    template_base64: Optional[str] = None

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    setor: Optional[str] = None
    cargo: Optional[str] = None
    template_base64: Optional[str] = None

class UsuarioResponse(UsuarioBase):
    id: int
    tem_biometria: bool = False
    total_presencas: int = 0
    data_cadastro: Optional[datetime] = None

    class Config:
        from_attributes = True

class RegistroPontoSchema(BaseModel):
    id: int
    usuario_id: int
    usuario_nome: str
    setor: Optional[str] = "Geral"
    data_registro: datetime
    hora_entrada: Optional[datetime] = None
    hora_saida: Optional[datetime] = None
    duracao_minutos: Optional[int] = None
    
    class Config:
        from_attributes = True

class MembroHorasResumo(BaseModel):
    usuario_id: int
    nome: str
    setor: str
    cargo: str
    total_minutos: int
    total_horas_formatado: str
    total_dias_presente: int

class RelatorioMensalResponse(BaseModel):
    mes: int
    ano: int
    mes_nome: str
    total_acessos: int
    total_horas_trabalhadas_minutos: int
    total_horas_formatado: str
    membros_ativos_qtd: int
    media_horas_dia_formatada: str
    membros_resumo: List[MembroHorasResumo]
    registros: List[RegistroPontoSchema]
