import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useNow() {
  const [now,setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => { setNow(Date.now()); },[]));
  return now;
}
