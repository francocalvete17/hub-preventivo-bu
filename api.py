from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

# Permite que tu web de Vercel se conecte con Python sin bloqueos de seguridad (CORS)
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
    
    # Soporta tanto archivos CSV como Excel reales del monitor de First Mile [cite: 13]
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
    
    # Identificar las columnas reales del reporte
    col_pendientes = 'Paquetes no entran en vehículo' if 'Paquetes no entran en vehículo' in df.columns else ('PP' if 'PP' in df.columns else None)
    col_estimados = 'Paquetes estimados' if 'Paquetes estimados' in df.columns else ('P' if 'P' in df.columns else None)
    
    if not col_pendientes:
        return {"error": "No se encontró la columna de paquetes pendientes por espacio"}
        
    # Filtrar solo la operación que quedó pendiente por falta de espacio
    criticos = df[df[col_pendientes] > 0].copy()
    resultados = []
    
    for _, fila in criticos.iterrows():
        shps_base = fila[col_estimados] if col_estimados else fila[col_pendientes]
        
        # Reglas oficiales de negocio para la asignación de soporte técnico en TOC
        if shps_base >= 30:
            accion = "🚨 SOLICITAR BU"
        elif 15 <= shps_base < 30:
            accion = "🚐 ENVIAR UZ / REATRIBUIR"
        else:
            accion = "ℹ️ ABSORBER EN ZONA"
            
        resultados.append({
            "idRuta": str(fila.get('ID de Ruta', fila.get('AP', 'N/A'))),
            "nombreRuta": str(fila.get('Nombre de Ruta', 'ARXCF1_OES_242')),
            "idSeller": str(fila.get('Seller ID', fila.get('ID de Parada', 'N/A'))),
            "vendedor": str(fila.get('Nombre', fila.get('Parada', 'N/A'))),
            "pendientes": int(fila[col_pendientes]),
            "accion": accion
        })
    
    # Devolver ordenados de mayor a menor gravedad de SHPs Pendientes
    return sorted(resultados, key=lambda x: x['pendientes'], reverse=True)
