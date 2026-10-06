from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract
import models
import schemas
from database import engine, get_db
from datetime import datetime, date
from typing import Optional, List

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Ponto Biométrico Baja Gralha", version="2.0")

# Configurar CORS para permitir o React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MESES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

def formatar_minutos(minutos_totais: int) -> str:
    horas = minutos_totais // 60
    mins = minutos_totais % 60
    if horas > 0:
        return f"{horas}h {mins:02d}m"
    return f"{mins}m"


# ==========================================
# GESTÃO DE USUÁRIOS (CRUD)
# ==========================================

@app.get("/usuarios", response_model=List[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(models.Usuario).order_by(models.Usuario.nome.asc()).all()
    resultado = []
    for u in usuarios:
        total_p = db.query(models.RegistroPonto).filter(models.RegistroPonto.usuario_id == u.id).count()
        resultado.append(schemas.UsuarioResponse(
            id=u.id,
            nome=u.nome,
            setor=u.setor or "Geral",
            cargo=u.cargo or "Membro",
            tem_biometria=bool(u.template_base64),
            total_presencas=total_p,
            data_cadastro=u.data_cadastro or datetime.utcnow()
        ))
    return resultado


@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def criar_usuario(payload: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Se forneceu ID manual, verifica se já existe
    if payload.id is not None:
        existente = db.query(models.Usuario).filter(models.Usuario.id == payload.id).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"Já existe um membro cadastrado com o ID {payload.id}.")
        novo_id = payload.id
    else:
        # Pega o maior id existente + 1 ou 101 padrão do Baja
        ultimo = db.query(models.Usuario).order_by(models.Usuario.id.desc()).first()
        novo_id = (ultimo.id + 1) if ultimo and ultimo.id else 101

    usuario = models.Usuario(
        id=novo_id,
        nome=payload.nome.strip(),
        setor=payload.setor.strip() if payload.setor else "Geral",
        cargo=payload.cargo.strip() if payload.cargo else "Membro",
        template_base64=payload.template_base64,
        data_cadastro=datetime.utcnow()
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return schemas.UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        setor=usuario.setor,
        cargo=usuario.cargo,
        tem_biometria=bool(usuario.template_base64),
        total_presencas=0,
        data_cadastro=usuario.data_cadastro
    )


@app.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def atualizar_usuario(usuario_id: int, payload: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    if payload.nome is not None:
        usuario.nome = payload.nome.strip()
    if payload.setor is not None:
        usuario.setor = payload.setor.strip()
    if payload.cargo is not None:
        usuario.cargo = payload.cargo.strip()
    if payload.template_base64 is not None:
        usuario.template_base64 = payload.template_base64

    db.commit()
    db.refresh(usuario)

    total_p = db.query(models.RegistroPonto).filter(models.RegistroPonto.usuario_id == usuario.id).count()
    return schemas.UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        setor=usuario.setor,
        cargo=usuario.cargo,
        tem_biometria=bool(usuario.template_base64),
        total_presencas=total_p,
        data_cadastro=usuario.data_cadastro or datetime.utcnow()
    )


@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    db.delete(usuario)
    db.commit()
    return {"success": True, "message": f"Membro {usuario.nome} (ID {usuario_id}) removido com sucesso."}


# ==========================================
# REGISTRO DE PONTO (BIOMETRIA)
# ==========================================

@app.post("/biometria/capturar", response_model=schemas.RegistroResponse)
def registrar_ponto(payload: schemas.BiometriaRegistroPayload, db: Session = Depends(get_db)):
    try:
        user_id = int(payload.usuario_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de usuário inválido")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        usuario = models.Usuario(
            id=user_id,
            nome=payload.nome.strip(),
            setor="Geral",
            cargo="Membro",
            template_base64=payload.template_base64,
            data_cadastro=datetime.utcnow()
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
    else:
        # Atualiza nome/template se alterados
        if payload.nome:
            usuario.nome = payload.nome.strip()
        if payload.template_base64:
            usuario.template_base64 = payload.template_base64
        db.commit()

    hoje = date.today()
    agora = datetime.now()

    # Busca registro mais recente de hoje
    registro_hoje = db.query(models.RegistroPonto).filter(
        models.RegistroPonto.usuario_id == user_id
    ).order_by(models.RegistroPonto.data_registro.desc()).first()

    if registro_hoje and registro_hoje.data_registro.date() == hoje:
        if not registro_hoje.hora_entrada:
            registro_hoje.hora_entrada = agora
            tipo = "Entrada"
        elif not registro_hoje.hora_saida:
            registro_hoje.hora_saida = agora
            tipo = "Saída"
        else:
            registro_hoje.hora_saida = agora
            tipo = "Saída Atualizada"
        db.commit()
    else:
        novo_registro = models.RegistroPonto(
            usuario_id=user_id,
            data_registro=agora,
            hora_entrada=agora
        )
        db.add(novo_registro)
        db.commit()
        tipo = "Entrada"

    return schemas.RegistroResponse(
        success=True,
        mensagem=f"{tipo} registrada com sucesso para {usuario.nome}!",
        tipo=tipo
    )


@app.get("/registros", response_model=List[schemas.RegistroPontoSchema])
def listar_registros(
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RegistroPonto).join(models.Usuario, isouter=True).order_by(models.RegistroPonto.data_registro.desc())
    if usuario_id is not None:
        query = query.filter(models.RegistroPonto.usuario_id == usuario_id)

    registros = query.all()
    resultado = []
    for reg in registros:
        duracao = None
        if reg.hora_entrada and reg.hora_saida:
            duracao = max(0, int((reg.hora_saida - reg.hora_entrada).total_seconds() // 60))

        resultado.append(schemas.RegistroPontoSchema(
            id=reg.id,
            usuario_id=reg.usuario_id,
            usuario_nome=reg.usuario.nome if reg.usuario else f"ID #{reg.usuario_id}",
            setor=reg.usuario.setor if reg.usuario and reg.usuario.setor else "Geral",
            data_registro=reg.data_registro,
            hora_entrada=reg.hora_entrada,
            hora_saida=reg.hora_saida,
            duracao_minutos=duracao
        ))
    return resultado


# ==========================================
# RELATÓRIOS MENSAIS E ESTATÍSTICAS
# ==========================================

@app.get("/relatorios/mensal", response_model=schemas.RelatorioMensalResponse)
def obter_relatorio_mensal(
    mes: int = Query(..., ge=1, le=12, description="Mês de 1 a 12"),
    ano: int = Query(..., ge=2020, le=2050, description="Ano"),
    usuario_id: Optional[int] = None,
    setor: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RegistroPonto).join(models.Usuario)
    
    # Filtro SQLite por ano e mês
    query = query.filter(
        extract('month', models.RegistroPonto.data_registro) == mes,
        extract('year', models.RegistroPonto.data_registro) == ano
    )

    if usuario_id is not None:
        query = query.filter(models.RegistroPonto.usuario_id == usuario_id)

    if setor and setor != "Todos":
        query = query.filter(models.Usuario.setor == setor)

    registros = query.order_by(models.RegistroPonto.data_registro.desc()).all()

    total_minutos_geral = 0
    dias_com_atividade = set()
    membros_map = {}

    lista_registros = []
    for reg in registros:
        u = reg.usuario
        dias_com_atividade.add(reg.data_registro.date())

        duracao = 0
        if reg.hora_entrada and reg.hora_saida:
            duracao = max(0, int((reg.hora_saida - reg.hora_entrada).total_seconds() // 60))
            total_minutos_geral += duracao

        lista_registros.append(schemas.RegistroPontoSchema(
            id=reg.id,
            usuario_id=reg.usuario_id,
            usuario_nome=u.nome if u else f"ID #{reg.usuario_id}",
            setor=u.setor if u and u.setor else "Geral",
            data_registro=reg.data_registro,
            hora_entrada=reg.hora_entrada,
            hora_saida=reg.hora_saida,
            duracao_minutos=duracao
        ))

        # Agrupamento por membro
        uid = reg.usuario_id
        if uid not in membros_map:
            membros_map[uid] = {
                "usuario_id": uid,
                "nome": u.nome if u else f"ID #{uid}",
                "setor": u.setor if u and u.setor else "Geral",
                "cargo": u.cargo if u and u.cargo else "Membro",
                "minutos": 0,
                "dias": set()
            }
        membros_map[uid]["minutos"] += duracao
        membros_map[uid]["dias"].add(reg.data_registro.date())

    membros_resumo = []
    for m in sorted(membros_map.values(), key=lambda x: x["minutos"], reverse=True):
        membros_resumo.append(schemas.MembroHorasResumo(
            usuario_id=m["usuario_id"],
            nome=m["nome"],
            setor=m["setor"],
            cargo=m["cargo"],
            total_minutos=m["minutos"],
            total_horas_formatado=formatar_minutos(m["minutos"]),
            total_dias_presente=len(m["dias"])
        ))

    num_dias = len(dias_com_atividade)
    media_min_dia = (total_minutos_geral // num_dias) if num_dias > 0 else 0

    return schemas.RelatorioMensalResponse(
        mes=mes,
        ano=ano,
        mes_nome=MESES_PT[mes] if 1 <= mes <= 12 else f"Mês {mes}",
        total_acessos=len(registros),
        total_horas_trabalhadas_minutos=total_minutos_geral,
        total_horas_formatado=formatar_minutos(total_minutos_geral),
        membros_ativos_qtd=len(membros_map),
        media_horas_dia_formatada=formatar_minutos(media_min_dia),
        membros_resumo=membros_resumo,
        registros=lista_registros
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8083)
