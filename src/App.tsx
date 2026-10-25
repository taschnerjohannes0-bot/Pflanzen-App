import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { PlantCard } from './components/PlantCard'
import { db, requestPersistentStorage } from './db/db'

function App() {
  const plants = useLiveQuery(() => db.plants.orderBy('name').toArray(), [])

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meine Pflanzen</h1>
      </header>

      <main>
        {plants && plants.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon" aria-hidden>🪴</div>
            <p>Noch keine Pflanzen angelegt.</p>
            <p className="muted">Bald kannst du hier deine erste Pflanze hinzufügen.</p>
          </div>
        )}

        {plants && plants.length > 0 && (
          <div className="plant-grid">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
