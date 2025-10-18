import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function TestSupabase() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from('products').select('*')
      if (error) setError(error)
      else setData(data)
    }
    loadData()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>✅ Test Supabase</h2>
      {error ? (
        <p style={{ color: 'red' }}>Erreur : {error.message}</p>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  )
}
