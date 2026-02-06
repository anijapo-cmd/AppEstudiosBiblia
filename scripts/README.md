# Importación de la Biblia RV1960

## Descripción

Este directorio contiene las herramientas necesarias para poblar la base de datos con el texto completo de la Biblia Reina-Valera 1960, separado por versículos individuales.

## Archivos

### `import-bible.html`
Herramienta web interactiva para importar la Biblia completa a la base de datos.

**Características:**
- Descarga automática del texto completo de RV1960 desde GitHub
- Importación por lotes para evitar errores de base de datos
- Interfaz con progreso en tiempo real
- Funciones de prueba de conexión y limpieza de datos

### `bible-data-rv1960.sql`
Archivo SQL con ejemplos de estructura de datos y algunos capítulos de muestra.

### `populate-bible.js`
Script Node.js auxiliar con utilidades para importación (opcional).

## Cómo Usar

### Opción 1: Herramienta Web (Recomendado)

1. Abre el archivo `import-bible.html` en tu navegador web
2. Haz clic en "Probar Conexión" para verificar que la base de datos esté accesible
3. Haz clic en "Iniciar Importación" para comenzar el proceso
4. Espera a que se complete (puede tomar varios minutos)
5. Verifica el progreso en el panel de registro

**Nota:** La importación completa incluye:
- 66 libros (39 del Antiguo Testamento, 27 del Nuevo Testamento)
- 1,189 capítulos
- Aproximadamente 31,102 versículos

### Opción 2: SQL Manual

Si prefieres importar manualmente:

```sql
-- Ejecuta el archivo SQL de muestra
\i scripts/bible-data-rv1960.sql
```

## Estructura de Datos

Cada versículo se almacena con la siguiente estructura:

```javascript
{
  id: number,              // ID único autoincremental
  book_id: number,         // ID del libro (1-66)
  chapter_number: number,  // Número de capítulo
  verse_number: number,    // Número de versículo
  text: string,            // Texto del versículo
  created_at: timestamp    // Fecha de creación
}
```

## Verificación

Después de la importación, puedes verificar los datos con:

```sql
-- Contar total de versículos
SELECT COUNT(*) FROM bible_verses;

-- Ver versículos de Génesis 1
SELECT * FROM bible_verses 
WHERE book_id = 1 AND chapter_number = 1 
ORDER BY verse_number;

-- Buscar versículos que contengan una palabra
SELECT bv.*, bb.name 
FROM bible_verses bv
JOIN bible_books bb ON bv.book_id = bb.id
WHERE bv.text ILIKE '%amor%'
LIMIT 10;
```

## Solución de Problemas

### Error de conexión
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de tener conexión a internet

### Errores de duplicados
- Usa el botón "Limpiar Base de Datos" antes de reimportar
- O ejecuta: `DELETE FROM bible_verses;`

### Importación incompleta
- Revisa el log de errores en la consola del navegador
- Verifica que no haya problemas de red
- Intenta importar nuevamente (usa `upsert` para evitar duplicados)

## Fuente de Datos

Los datos se obtienen de:
- **Repositorio:** https://github.com/dscottpi/bibles
- **Archivo:** RVR1960 - Spanish.json
- **Versión:** Reina-Valera 1960
- **Licencia:** Dominio público

## Notas Técnicas

- La importación usa `upsert` para evitar duplicados
- Los lotes son de 100 versículos para optimizar rendimiento
- Hay una pausa de 200ms entre libros para no saturar la base de datos
- El índice de búsqueda de texto completo está configurado para español
