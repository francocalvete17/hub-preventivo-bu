import streamlit as st
import pandas as pd
import io

st.set_page_config(page_title="TOC MLA - HUB de Gestión", page_icon="🚚", layout="wide")

st.title("🚚 HUB de Operaciones - Control de Backups")
st.markdown("### Gestión AM Preventivo | Gestión PM Reactivo")

# Selector de turno tal como figura en Figma
turno = st.radio("Seleccioná el Turno de Gestión actual:", ["Gestión AM Preventivo", "Gestión PM Reactivo"], horizontal=True)

archivo = st.file_uploader("Arrastrá o seleccioná el archivo CSV del monitor de First Mile", type=["csv"])

if archivo is not None:
    df = pd.read_csv(io.BytesIO(archivo.read()))
    
    # Limpieza
    df['Volumen_Num'] = df['Volumen colectado'].astype(str).str.replace(' m3', '').str.strip().astype(float)
    
    if "Gestión AM Preventivo" in turno:
        st.subheader("🔮 Proyección teórica de saturación (Capacidad crítica)")
        # Lógica AM
        alertas_am = []
        for id_ruta, grupo in df.groupby('ID de Ruta'):
            vol_acum = grupo['Volumen_Num'].sum()
            if vol_acum > 8.5: # Ejemplo umbral 85%
                alertas_am.append({
                    'ID Ruta': id_ruta, 'Ruta': grupo['Nombre de Ruta'].iloc[0],
                    'Vendedor': grupo['Parada'].iloc[0], 'ID Seller': grupo['ID de Parada'].iloc[0],
                    'Volumen Est. (m3)': round(vol_acum, 2)
                })
        st.dataframe(pd.DataFrame(alertas_am), use_container_width=True)
        
    else:
        st.subheader("🚨 Radar Operativo - Identificación de SHPs Pendientes")
        criticos = df[df['Paquetes no entran en vehículo'] > 0].copy()
        
        if not criticos.empty:
            resultados = []
            for _, fila in criticos.iterrows():
                shps = fila['Paquetes estimados']
                if shps >= 30: accion = "🚨 SOLICITAR BU"
                elif 15 <= shps < 30: accion = "🚐 ENVIAR UZ / REATRIBUIR"
                else: accion = "ℹ️ BAJO VOLUMEN (<15)"
                
                resultados.append({
                    'ID Ruta': fila['ID de Ruta'], 'Nombre Ruta': fila['Nombre de Ruta'],
                    'ID Seller': fila['ID de Parada'], 'Vendedor': fila['Parada'],
                    'SHPs Pendientes': fila['Paquetes no entran en vehículo'], 'Acción Operativa': accion
                })
            
            df_pm = pd.DataFrame(resultados).sort_values(by='SHPs Pendientes', ascending=False)
            st.dataframe(df_pm, use_container_width=True)
            
            # Formulario interactivo idéntico al Pop-up de Figma
            st.markdown("---")
            st.markdown("### 📝 Formulario de Asignación de Unidad de Respaldo")
            col1, col2 = st.columns(2)
            id_ruta_bu = col1.text_input("Ingrese el ID de Ruta del BU asignado (Ej: 142513999):")
            if col2.button("Confirmar Despacho") and id_ruta_bu:
                st.success(f"¡BU registrado con éxito! Ruta de auxilio {id_ruta_bu} vinculada en el sistema.")
        else:
            st.success("🎉 ¡No hay incidentes de espacio reportados en el monitor!")
