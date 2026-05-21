from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

# Permite que el diseño visual de Figma se conecte con Python sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analizar-pm")
async def analizar_pm(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    col_pendientes = 'Paquetes no entran en vehículo' if 'Paquetes no entran en vehículo' in df.columns else ('PP' if 'PP' in df.columns else None)
    
    if not col_pendientes:
        return {"error": "No se encontró la columna de pendientes"}
        
    criticos = df[df[col_pendientes] > 0].copy()
    resultados = []
    
    for _, fila in criticos.iterrows():
        shps = fila.get('Paquetes estimados', fila[col_pendientes])
        accion = "🚨 SOLICITAR BU" if shps >= 30 else ("🚐 ENVIAR UZ / REATRIBUIR" if 15 <= shps < 30 else "ℹ️ ABSORBER")
        
        resultados.append({
            "idRuta": str(fila.get('ID de Ruta', fila.get('AP', 'N/A'))),
            "nombreRuta": str(fila.get('Nombre de Ruta', 'ARXCF1_OES_242')),
            "idSeller": str(fila.get('Seller ID', 'N/A')),
            "vendedor": str(fila.get('Nombre', fila.get('Parada', 'N/A'))),
            "pendientes": int(fila[col_pendientes]),
            "accion": accion
        })
    
    return sorted(resultados, key=lambda x: x['pendientes'], reverse=True)
