'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import PlayerModal from './PlayerModal'

const PlayerContext = createContext(null)

export function usePlayer() {
  return useContext(PlayerContext)
}

export default function PlayerProvider({ children }) {
  const [playerItem, setPlayerItem] = useState(null)

  const openPlayer = useCallback((item) => setPlayerItem(item), [])
  const closePlayer = useCallback(() => setPlayerItem(null), [])

  return (
    <PlayerContext.Provider value={{ openPlayer, closePlayer }}>
      {children}
      {playerItem && <PlayerModal item={playerItem} onClose={closePlayer} />}
    </PlayerContext.Provider>
  )
}
