import { useState, useEffect } from 'react'
import { storage } from '../lib/storage'
import { supabase } from '../lib/supabase'

export function useArea() {
  const [selectedArea, setSelectedAreaState] = useState<string>(
    storage.getString('selected_area') ?? 'المنصورية'
  )
  const [availableAreas, setAvailableAreas] = useState<string[]>(['المنصورية'])

  useEffect(() => {
    supabase
      .from('app_config')
      .select('value')
      .eq('key', 'current_area')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const areas = data.value.split(',').map((a: string) => a.trim())
          setAvailableAreas(areas)
          if (!areas.includes(selectedArea)) {
            setSelectedAreaState(areas[0])
            storage.set('selected_area', areas[0])
          }
        }
      })
  }, [])

  const setSelectedArea = (area: string) => {
    setSelectedAreaState(area)
    storage.set('selected_area', area)
  }

  return { selectedArea, availableAreas, setSelectedArea }
}
