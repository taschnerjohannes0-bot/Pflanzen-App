import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { ComparePage } from './components/ComparePage'
import { PlantCard } from './components/PlantCard'
import { PlantDetail } from './components/PlantDetail'
import { PlantForm } from './components/PlantForm'
import { db, requestPersistentStorage } from './db/db'
import { processPendingCutouts } from './lib/cutoutQueue'
import { routeHref, useRoute } from './lib/router'

function App() {
  const route = useRoute()

  useEffect(() => {
    requestPersistentStorage()
    // Fotos, deren Freistellung beim letzten Mal unterbrochen wurde, weiter bearbeiten.
    processPendingCutouts()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.name])

  return (
    <div className="app">
      {route.name === 'home' && <Home />}
      {route.name === 'new' && <PlantForm />}
      {route.name === 'edit' && <PlantForm id={route.id} />}
      {route.name === 'plant' && <PlantDetail id={route.id} />}
      {route.name === 'compare' && <ComparePage id={route.id} a={route.a} b={route.b} />}
    </div>
  )
}

function Home() {
  const plants = useLiveQuery(() => db.plants.orderBy('name').toArray(), [])

  return (
    <>
      <header className="app-header">
        <h1>Meine Pflanzen</h1>
      </header>

      <main>
        {plants && plants.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon" aria-hidden>🪴</div>
            <p>Noch keine Pflanzen angelegt.</p>
            <a className="button button--primary" href={routeHref({ name: 'new' })}>
              Erste Pflanze hinzufügen
            </a>
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

      {plants && plants.length > 0 && (
        <a className="fab" href={routeHref({ name: 'new' })} aria-label="Pflanze hinzufügen">
          +
        </a>
      )}
    </>
  )
}

export default App
