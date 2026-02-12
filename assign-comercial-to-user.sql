-- Script para asignar comercial_id al usuario actual
-- Este script asigna el comercial_id correcto al usuario que está creando prospectos

-- Primero, verificar qué usuario está logueado y qué comercial_id tiene
SELECT 
    id,
    email,
    comercial_id,
    role
FROM users
WHERE id = '33dea371-e7db-4af3-aa7e-d157557c31ef'; -- Este es el created_by del prospecto

-- Verificar qué comerciales existen
SELECT 
    id,
    name,
    email,
    is_active
FROM comerciales
WHERE is_active = true
ORDER BY name;

-- IMPORTANTE: Antes de ejecutar el UPDATE, verifica:
-- 1. Qué usuario está en la primera query
-- 2. Qué comercial_id quieres asignarle (de la segunda query)

-- Luego, ejecuta este UPDATE reemplazando 'COMERCIAL_ID_AQUI' con el ID correcto:
-- UPDATE users
-- SET comercial_id = 'COMERCIAL_ID_AQUI'
-- WHERE id = '33dea371-e7db-4af3-aa7e-d157557c31ef';

-- Ejemplo: Si el comercial_id correcto es '44e2fc1d-bc02-4fe5-ba38-b01ac3b76e69':
UPDATE users
SET comercial_id = '44e2fc1d-bc02-4fe5-ba38-b01ac3b76e69'
WHERE id = '33dea371-e7db-4af3-aa7e-d157557c31ef';

-- Verificar que se actualizó correctamente
SELECT 
    id,
    email,
    comercial_id,
    role
FROM users
WHERE id = '33dea371-e7db-4af3-aa7e-d157557c31ef';
