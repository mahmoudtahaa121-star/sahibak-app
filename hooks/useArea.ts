import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';

export function useArea() {
  const [selectedArea, setSelectedAreaState] = useState<string>(
    storage?.getString('selected_area') ?? 'المنصورية'
  );
  const [availableAreas, setAvailableAreas] = useState<string[]>(['المنصورية']);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'current_area')
          .single();

        if (error) {
          return;
        }

        if (data?.value) {
          const areas = data.value.split(',').map((a: string) => a.trim());
          setAvailableAreas(areas);

          if (!areas.includes(selectedArea)) {
            const newArea = areas[0];
            setSelectedAreaState(newArea);
            if (storage) {
              storage.set('selected_area', newArea);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } // Will use default area
    };

    fetchAreas();
  }, []);

  const setSelectedArea = (area: string) => {
    setSelectedAreaState(area);

    if (storage) {
      storage.set('selected_area', area);
    }
  };

  return { selectedArea, availableAreas, setSelectedArea };
}
