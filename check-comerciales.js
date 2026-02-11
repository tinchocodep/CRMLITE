// Script temporal para verificar los comerciales en Supabase
// Ejecutar en la consola del navegador (F12) cuando la app esté abierta

import { supabase } from './src/lib/supabase.js';

async function checkComerciales() {
    console.log('🔍 Consultando comerciales en Supabase...');

    const { data, error } = await supabase
        .from('comerciales')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('✅ Comerciales encontrados:');
    console.table(data);

    return data;
}

checkComerciales();
