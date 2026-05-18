import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { equipo_id, aprobar, notas } = await req.json()

    if (!equipo_id || typeof aprobar !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .rpc('validar_garantia', {
        p_equipo_id: equipo_id,
        p_aprobar: aprobar,
        p_notas: notas ?? null,
      })

    if (error) {
      console.error('[validar-garantia]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
