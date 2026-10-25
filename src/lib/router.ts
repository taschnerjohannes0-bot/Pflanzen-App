import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'plant'; id: number }
  | { name: 'edit'; id: number }

// Hash-Routing (#/pflanze/3), damit die Zurück-Taste am Handy funktioniert und kein Server nötig ist.
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'neu') return { name: 'new' }
  if (parts[0] === 'pflanze' && Number(parts[1])) {
    const id = Number(parts[1])
    return parts[2] === 'bearbeiten' ? { name: 'edit', id } : { name: 'plant', id }
  }
  return { name: 'home' }
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'new':
      return '#/neu'
    case 'plant':
      return `#/pflanze/${route.id}`
    case 'edit':
      return `#/pflanze/${route.id}/bearbeiten`
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const href = routeHref(route)
  if (replace) {
    history.replaceState(null, '', href)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    location.hash = href
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parseRoute(hash)
}
