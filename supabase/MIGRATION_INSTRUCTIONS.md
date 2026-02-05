# Instrucciones para Ejecutar la Migración de Supervisor-Comerciales

## 📋 Resumen
Esta migración crea la tabla `supervisor_comerciales` que permite asignar comerciales específicos a cada supervisor.

## 🔧 Pasos para Ejecutar la Migración

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Ir al Dashboard de Supabase**
   - URL: https://supabase.com/dashboard/project/lifeqgwsyopvaevywtsf
   - Iniciar sesión con tu cuenta

2. **Abrir el SQL Editor**
   - En el menú lateral, hacer clic en "SQL Editor"
   - Hacer clic en "+ New query"

3. **Copiar y Pegar el SQL**
   - Abrir el archivo: `supabase/migrations/20260205_create_supervisor_comerciales.sql`
   - Copiar TODO el contenido
   - Pegarlo en el editor SQL

4. **Ejecutar la Migración**
   - Hacer clic en el botón "Run" (o presionar Cmd/Ctrl + Enter)
   - Verificar que aparezca el mensaje de éxito

5. **Verificar la Tabla**
   - Ir a "Table Editor" en el menú lateral
   - Buscar la tabla `supervisor_comerciales`
   - Verificar que tenga las columnas correctas

### Opción 2: Usando Supabase CLI (Avanzado)

```bash
# 1. Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# 2. Iniciar sesión
supabase login

# 3. Link al proyecto
supabase link --project-ref lifeqgwsyopvaevywtsf

# 4. Aplicar la migración
supabase db push
```

## 📊 Estructura de la Tabla Creada

```sql
supervisor_comerciales
├── id (UUID, PK)
├── supervisor_id (UUID, FK → comerciales)
├── comercial_id (UUID, FK → comerciales)
├── created_at (TIMESTAMP)
└── created_by (UUID, FK → auth.users)
```

## 🔐 Políticas RLS Creadas

- ✅ **SELECT**: Todos los usuarios autenticados pueden leer
- ✅ **INSERT**: Solo admins pueden crear asignaciones
- ✅ **UPDATE**: Solo admins pueden modificar asignaciones
- ✅ **DELETE**: Solo admins pueden eliminar asignaciones

## 📝 Cómo Asignar Comerciales a un Supervisor

Una vez ejecutada la migración, puedes asignar comerciales desde el SQL Editor:

```sql
-- Ejemplo: Asignar comerciales a un supervisor
INSERT INTO public.supervisor_comerciales (supervisor_id, comercial_id, created_by)
VALUES 
  ('uuid-del-supervisor', 'uuid-del-comercial-1', auth.uid()),
  ('uuid-del-supervisor', 'uuid-del-comercial-2', auth.uid());
```

### Obtener UUIDs de Comerciales

```sql
-- Ver todos los comerciales y sus IDs
SELECT 
  c.id,
  c.name,
  c.email,
  u.role
FROM comerciales c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY u.role, c.name;
```

## ✅ Verificación Post-Migración

Ejecuta este query para verificar que todo funciona:

```sql
-- Ver asignaciones de supervisores
SELECT 
  s.name as supervisor,
  c.name as comercial,
  sc.created_at
FROM supervisor_comerciales sc
JOIN comerciales s ON sc.supervisor_id = s.id
JOIN comerciales c ON sc.comercial_id = c.id
ORDER BY s.name, c.name;
```

## 🎯 Próximos Pasos

Después de ejecutar la migración:

1. ✅ La tabla estará creada
2. ✅ El código frontend ya está actualizado para usarla
3. ⚠️ Necesitas asignar comerciales a los supervisores manualmente (ver ejemplo arriba)
4. ✅ Los supervisores verán automáticamente solo sus comerciales asignados

## 🚨 Importante

- La migración es **idempotente** (puedes ejecutarla múltiples veces sin problemas)
- Usa `IF NOT EXISTS` para evitar errores si la tabla ya existe
- Las políticas RLS garantizan que solo admins puedan modificar asignaciones

## 📞 Soporte

Si encuentras algún error durante la ejecución:
1. Copia el mensaje de error completo
2. Verifica que tengas permisos de admin en Supabase
3. Revisa que las tablas `comerciales` y `users` existan
