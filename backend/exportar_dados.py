import json
from database import SessionLocal
import models

def exportar_para_json():
    db = SessionLocal()
    try:
        usuarios = db.query(models.Usuario).all()
        registros = db.query(models.RegistroPonto).all()

        dados = {
            "usuarios": [
                {
                    "id": u.id,
                    "nome": u.nome,
                    "setor": u.setor,
                    "cargo": u.cargo,
                    "template_base64": u.template_base64,
                    "data_cadastro": u.data_cadastro.isoformat() if u.data_cadastro else None
                }
                for u in usuarios
            ],
            "registros": [
                {
                    "id": r.id,
                    "usuario_id": r.usuario_id,
                    "data_registro": r.data_registro.isoformat() if r.data_registro else None,
                    "hora_entrada": r.hora_entrada.isoformat() if r.hora_entrada else None,
                    "hora_saida": r.hora_saida.isoformat() if r.hora_saida else None
                }
                for r in registros
            ]
        }

        with open("dados_exportados.json", "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)

        print(f"Exportação concluída com sucesso!")
        print(f"Membros exportados: {len(dados['usuarios'])}")
        print(f"Registros de ponto exportados: {len(dados['registros'])}")
        print(f"Arquivo gerado: backend/dados_exportados.json")
    finally:
        db.close()

if __name__ == "__main__":
    exportar_para_json()
