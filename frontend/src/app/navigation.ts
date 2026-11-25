import { useEffect, useState } from 'react'

export const routes = {
  map: '#mapa',
  login: '#/entrar',
  signup: '#/criar-conta',
  report: '#/registrar',
  reports: '#/meus-relatos',
  moderation: '#/moderacao',
  alerts: '#/alertas',
  about: '#/sobre',
} as const

export type Route = keyof typeof routes

function currentRoute(): Route {
  return (Object.keys(routes) as Route[]).find(route => routes[route] === window.location.hash) ?? 'map'
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    function onHashChange() {
      setRoute(currentRoute())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

export function navigate(route: Route) {
  window.location.hash = routes[route]
}
