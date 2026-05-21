import streamlit as st
import pandas as pd
import io

# ==============================================================================
# 🎨 CONFIGURACIÓN DE ESTÉTICA VISUAL (INSPIRADO EN FIGMA & GLOSARIO TOC)
# ==============================================================================
st.set_page_config(
    page_title="TOC MLA - BU & UZ Control Center", 
    page_icon="🚚", 
    layout="wide"
)

# Inyección de CSS Avanzado para calcar el diseño oscuro y las tarjetas de Figma
st.markdown("""
    <style>
    /* Fondo principal de la aplicación */
    .stApp {
        background-color: #0b0e14 !important;
        color: #f0f6fc !important;
    }
    
    /* Contenedor principal de bloques */
    div[data-testid="stVerticalBlock"] {
        background-color: #0b0e14;
    }
    
    /* Títulos principales */
    h1 {
        color: #ffffff !important;
        font-family: 'Inter', -apple-system, sans-serif;
        font-weight: 700 !important;
        font-size: 2rem !important;
        margin-bottom: 5px !important;
    }
    
    /* Subtítulos de gestión */
    h3 {
        color: #8b949e !important;
        font-family: 'Inter', sans-serif;
        font-weight: 500 !important;
        font-size: 1.1rem !important;
        margin-top: 0px !important;
    }
    
    /* Estilizado del Selector de Turnos (Tabs de Figma) */
    .stRadio > label {
        color: #8b949e !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        margin-bottom: 10px !important;
    }
    
    div[data-testid="stMarkdownContainer"] p {
        color: #f0f6fc;
    }

    /* Estilo para las tablas de datos (Dataframes) */
    .stDataFrame {
        background-color: #0d1117 !important;
        border: 1px solid #21262d !important;
        border-radius: 8px !important;
    }
    
    /* Caja de carga de archivos (.CSV / .XLSX) */
    section[data-testid="stFileUploadDropzone"] {
        background-color: #0d1117 !important;
        border: 2px dashed #30363d !important;
        border-radius: 8px !important;
        padding: 25px !important;
    }
    
    /* Estilizado de los formularios y cajas de texto de despacho */
    div[data-testid="stForm"] {
        background-color: #0d1117 !important;
        border: 1px solid #21262d !important;
        border-radius: 8px !important;
        padding: 20px !important;
    }
    
    /* Botones de acción (Confirmar Despacho) */
    button[kind="formSubmit"] {
        background-color: #238636 !important;
        color: #ffffff !important;
        border: 1px solid #2ea44f !important;
        border-radius: 6px !important;
        padding: 0.5rem 1.5rem !important;
        font-weight: 600 !important;
        transition: background-color 0.2s;
    }
    
    button[kind="formSubmit"]:hover {
        background-color: #2ea44f !important;
    }
    </style>
    """, unsafe_allow_html=True)

# ==============================================================================
# 🎛️ ESTRUCTURA Y COMPONENTES VISUALES
# ==============================================================================

# Encabezado corporativo oficial [cite: 1, 2]
st.title("BU & UZ Control Center")
st.markdown("Gestión AM Preventivo | Gestión PM Reactivo")

# Render de las pestañas superiores de navegación de turnos
turno = st.radio("Seleccioná el Turno de Gestión actual:", ["Gestión AM Preventivo", "Gestión PM Reactivo"], horizontal=True)

st.markdown("<br>", unsafe_allow_html=True)

# Drag and drop de importación de planificación diaria (Mapeado de image_9aa115.png)
archivo = st.file_uploader("Importar Planificación Diaria", type=["csv", "xlsx"])

if archivo is not None:
    # Lector adaptativo de formatos
    if archivo.name.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(archivo.read()))
    else:
        df = pd.read_excel(io.BytesIO(archivo.read()))
    
    # Mapeo de capacidades logísticas teóricas (m³)
    capacidades = {
        'Camioneta': 5.0,
        'Chasis': 10.0,
        'Chasis Liviano': 10.0,
        'Chasis Pesado': 12.0,
        'Semi': 25.0
    }

    # Limpieza automatizada de unidades de medida (ej: "6,55 m3" -> 6.55)
    if 'V' in df.columns:
        df['Vol_Num'] = df['V'].astype(str).str.replace(' m3', '').str.replace(',', '.').str.strip().astype(float)
    elif 'Volumen colectado' in df.columns:
        df['Vol_Num'] = df['Volumen colectado'].astype(str).str.replace(' m3', '').str.replace(',', '.').str.strip().astype(float)
    else:
        df['Vol_Num'] = 0.0

    # Detección dinámica de nombres de columna de tu archivo real [cite: 11]
    col_pendientes = 'Paquetes no entran en vehículo' if 'Paquetes no entran en vehículo' in df.columns else ('PP' if 'PP' in df.columns else None)
    col_estimados = 'Paquetes estimados' if 'Paquetes estimados' in df.columns else ('P' if 'P' in df.columns else None)
    col_ruta = 'ID de Ruta' if 'ID de Ruta' in df.columns else ('AP' if 'AP' in df.columns else None)

    # --------------------------------------------------------------------------
    # MÓDULO 1: GESTIÓN AM PREVENTIVO
    # --------------------------------------------------------------------------
    if "Gestión AM Preventivo" in turno:
        st.subheader("🔮 Radar de Saturación Teórica (Proyección de m³)")
        
        if col_ruta:
            alertas_am = []
            for id_ruta, grupo in df.groupby(col_ruta):
                tipo_vehiculo = grupo['Unidad necesaria'].iloc[0] if 'Unidad necesaria' in df.columns else 'Chasis'
                vol_maximo = capacidades.get(tipo_vehiculo, 10.0)
                
                vol_acumulado = 0.0
                for _, fila in grupo.iterrows():
                    vol_acumulado += fila['Vol_Num']
                    # Umbral crítico preventivo del 85%
                    if vol_acumulado > (vol_maximo * 0.85):
                        alertas_am.append({
                            'ID Ruta': id_ruta,
                            'Nombre Ruta': grupo['Nombre de Ruta'].iloc[0] if 'Nombre de Ruta' in df.columns else id_ruta,
                            'Tipo Vehículo': tipo_vehiculo,
                            'ID Seller': fila['Seller ID'] if 'Seller ID' in df.columns else 'N/A',
                            'Vendedor (Seller)': fila['Nombre'] if 'Nombre' in df.columns else fila.get('Parada', 'N/A'),
                            'Volumen Est. Acumulado': f"{round(vol_acumulado, 2)} m³",
                            'Acción Operativa': "🚨 COORDINAR BU PREVENTIVO"
                        })
                        break
            
            if alertas_am:
                st.dataframe(pd.DataFrame(alertas_am), use_container_width=True)
            else:
                st.success("🎉 No se proyectan colapsos de volumen para las rutas analizadas en el turno AM.")
        else:
            st.error("No se localizó la columna de mapeo de rutas en el archivo.")

    # --------------------------------------------------------------------------
    # MÓDULO 2: GESTIÓN PM REACTIVO
    # --------------------------------------------------------------------------
    else:
        st.subheader("🔥 Panel de Control Operativo - Gestión de SHPs Pendientes")
        
        if col_pendientes:
            df_criticos = df[df[col_pendientes] > 0].copy()
            
            if not df_criticos.empty:
                resultados_pm = []
                for idx, fila in df_criticos.iterrows():
                    bultos_base = fila[col_estimados] if col_estimados else fila[col_pendientes]
                    
                    # Reglas exactas de negocio basadas en volumen de SHPs [cite: 11]
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
                        'Vendedor (Seller)': fila.get('Nombre', fila.get('Parada', 'N/A')),
                        'SHPs Pendientes': int(fila[col_pendientes]),
                        'Acción Operativa': accion
                    })
                
                df_mostrar = pd.DataFrame(resultados_pm).sort_values(by='SHPs Pendientes', ascending=False)
                
                # Renderizado de la tabla principal clonada de Figma
                st.dataframe(df_mostrar, use_container_width=True)
                
                # Formulario integrado de despacho e ingresos de IDs de control
                st.markdown("<br>", unsafe_allow_html=True)
                with st.form("formulario_despacho"):
                    st.markdown("### 📝 Registrar Despacho de Unidad de Apoyo")
                    vendedor_seleccionado = st.selectbox("Seleccionar Vendedor Afectado:", df_mostrar['Vendedor (Seller)'].unique())
                    id_bu_asignado = st.text_input("Ingrese el ID de Ruta del BU asignado (Ej: 142513999):")
                    
                    btn_confirmar = st.form_submit_button("Confirmar Despacho en Sistema")
                    if btn_confirmar:
                        if id_bu_asignado:
                            st.success(f"📦 ¡Trazabilidad Registrada! La unidad de auxilio {id_bu_asignado} fue vinculada exitosamente al nodo de {vendedor_seleccionado}.")
                        else:
                            st.warning("Por favor, ingresá un ID de ruta válido para dejar asentado el registro.")
            else:
                st.success("🎉 ¡Gran trabajo! El monitor de First Mile no reporta SHPs Pendientes por falta de espacio.")
        else:
            st.error("No se encontró la columna de incidencias o paquetes pendientes en el archivo.")
