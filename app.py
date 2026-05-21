import streamlit as st
import pandas as pd
import io

st.set_page_config(page_title="TOC MLA - Control Center", page_icon="🚚", layout="wide")

# Estilos CSS para emparejar la estética oscura de Figma
st.markdown("""
    <style>
    .main { background-color: #0d1117; }
    h1, h3 { color: #f0f6fc; }
    .stRadio > label { color: #f0f6fc !important; font-weight: bold; }
    </style>
    """, unsafe_allow_html=True)

st.title("🚚 BU & UZ Control Center")
st.markdown("### Gestión AM Preventivo | Gestión PM Reactivo")

# Selector de turno idéntico a los botones superiores de tu Figma
turno = st.radio("Seleccioná el Turno de Gestión:", ["Gestión AM Preventivo", "Gestión PM Reactivo"], horizontal=True)

st.markdown("---")
archivo = st.file_uploader("Importar Planificación Diaria (Formatos .csv o .xlsx)", type=["csv", "xlsx"])

if archivo is not None:
    # Leer según formato
    if archivo.name.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(archivo.read()))
    else:
        df = pd.read_excel(io.BytesIO(archivo.read()))
    
    # --- CONFIGURACIÓN DE CAPACIDADES CRÍTICAS ---
    capacidades = {
        'Camioneta': 5.0,
        'Chasis': 10.0,
        'Chasis Liviano': 10.0,
        'Chasis Pesado': 12.0,
        'Semi': 25.0
    }

    # Limpieza matemática de strings de volumen (ej: "2,46 m3" -> 2.46)
    if 'V' in df.columns:
        df['Vol_Num'] = df['V'].astype(str).str.replace(' m3', '').str.replace(',', '.').str.strip().astype(float)
    elif 'Volumen colectado' in df.columns:
        df['Vol_Num'] = df['Volumen colectado'].astype(str).str.replace(' m3', '').str.replace(',', '.').str.strip().astype(float)
    else:
        # Fallback si las columnas vienen con encabezados alternativos
        df['Vol_Num'] = 0.0

    # Determinar columna de bultos caídos/pendientes
    col_pendientes = 'Paquetes no entran en vehículo' if 'Paquetes no entran en vehículo' in df.columns else ('PP' if 'PP' in df.columns else None)
    col_estimados = 'Paquetes estimados' if 'Paquetes estimados' in df.columns else ('P' if 'P' in df.columns else None)

    # ==========================================
    # LÓGICA: GESTIÓN AM PREVENTIVO
    # ==========================================
    if "Gestión AM Preventivo" in turno:
        st.subheader("🔮 Radar de Saturación Teórica (Proyección de m³)")
        
        col_ruta = 'ID de Ruta' if 'ID de Ruta' in df.columns else ('AP' if 'AP' in df.columns else None)
        
        if col_ruta:
            alertas_am = []
            for id_ruta, grupo in df.groupby(col_ruta):
                tipo_vehiculo = grupo['Unidad necesaria'].iloc[0] if 'Unidad necesaria' in df.columns else 'Chasis'
                vol_maximo = capacidades.get(tipo_vehiculo, 10.0)
                
                vol_acumulado = 0.0
                for _, fila in grupo.iterrows():
                    vol_acumulado += fila['Vol_Num']
                    # Si proyecta superar el 85% de la capacidad de la unidad antes de terminar, alertamos
                    if vol_acumulado > (vol_maximo * 0.85):
                        alertas_am.append({
                            'ID Ruta': id_ruta,
                            'Nombre Ruta': grupo['Nombre de Ruta'].iloc[0] if 'Nombre de Ruta' in df.columns else id_ruta,
                            'Tipo Vehículo': tipo_vehiculo,
                            'ID Seller': fila['Seller ID'] if 'Seller ID' in df.columns else 'N/A',
                            'Seller / Place': fila['Nombre'] if 'Nombre' in df.columns else fila.get('Parada', 'N/A'),
                            'Volumen Est. Acumulado': f"{round(vol_acumulado, 2)} m³",
                            'Acción Operativa': "🚨 COORDINAR BU PREVENTIVO"
                        })
                        break
            
            if alertas_am:
                st.dataframe(pd.DataFrame(alertas_am), use_container_width=True)
            else:
                st.success("🎉 No se proyectan colapsos de volumen para las rutas analizadas en el turno AM.")
        else:
            st.error("No se reconoció la columna de rutas en el archivo cargado.")

    # ==========================================
    # LÓGICA: GESTIÓN PM REACTIVO
    # ==========================================
    else:
        st.subheader("🔥 Panel de Control Operativo - Gestión de SHPs Pendientes")
        
        if col_pendientes:
            # Filtrar filas donde hay paquetes que quedaron pendientes por espacio
            df_criticos = df[df[col_pendientes] > 0].copy()
            
            if not df_criticos.empty:
                resultados_pm = []
                for idx, fila in df_criticos.iterrows():
                    # Usamos los paquetes estimados de la parada para aplicar tus rangos de decisión
                    bultos_base = fila[col_estimados] if col_estimados else fila[col_pendientes]
                    
                    if bultos_base >= 30:
                        accion = "🚨 SOLICITAR BU"
                    elif 15 <= bultos_base < 30:
                        accion = "🚐 ENVIAR UZ / REATRIBUIR"
                    else:
                        accion = "ℹ️ ABSORBER EN ZONA"
                    
                    resultados_pm.append({
                        'ID Ruta': fila.get('ID de Ruta', fila.get('AP', 'N/A')),
                        'Nombre Ruta': fila.get('Nombre de Ruta', 'ARXCF1_OES_242'),
                        'ID Seller': fila.get('Seller ID', fila.get('ID de Parada', 'N/A')),
                        'Seller / Place': fila.get('Nombre', fila.get('Parada', 'N/A')),
                        'SHPs Pendientes': int(fila[col_pendientes]),
                        'Acción Operativa': list_badge_style(accion) # Indicador visual
                    })
                
                df_mostrar = pd.DataFrame(resultados_pm).sort_values(by='SHPs Pendientes', ascending=False)
                st.dataframe(df_mostrar, use_container_width=True)
                
                # --- TRAZABILIDAD INTERACTIVA ---
                st.markdown("### 📝 Despacho de Unidades de Apoyo")
                with st.form("formulario_despacho"):
                    st.markdown("Seleccioná un Seller crítico y vinculá la nueva ruta de auxilio:")
                    vendedor_seleccionado = st.selectbox("Vendedor con Incidencia:", df_mostrar['Seller / Place'].unique())
                    id_bu_asignado = st.text_input("Ingrese el ID de Ruta del BU asignado (Ej: 142513999):")
                    
                    btn_confirmar = st.form_submit_button("Confirmar Despacho en Sistema")
                    if btn_confirmar:
                        if id_bu_asignado:
                            st.success(f"📦 ¡Trazabilidad Registrada! El auxilio {id_bu_asignado} fue vinculado exitosamente al nodo de {vendedor_seleccionado}.")
                        else:
                            st.warning("Por favor, ingresá un ID de ruta válido para dejar asentado el registro.")
            else:
                st.success("🎉 ¡Gran trabajo! El monitor de First Mile no reporta SHPs Pendientes por falta de espacio.")
        else:
            st.error("No se encontró la columna de incidencias o paquetes pendientes en el archivo.")

def list_badge_style(accion):
    return accion
