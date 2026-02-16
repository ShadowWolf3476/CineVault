const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w780'

const apiKey = import.meta.env.VITE_TMDB_API_KEY

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_TMDB_API_KEY. Add it to .env and restart the dev server.')
}

export type TmdbMovie = {
  id: number
  title: string
  release_date?: string
  poster_path: string | null
  vote_average: number
  genre_ids: number[]
  overview?: string
}

export type TmdbGenre = { id: number; name: string }

type ListResponse<T> = {
  results: T[]
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey ?? '')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TMDB error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function fetchGenres() {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list', { language: 'en-US' })
  return data.genres
}

export async function searchMovies(query: string, sortBy: string, genreId?: number) {
  if (!query) return [] as TmdbMovie[]
  const data = await tmdbFetch<ListResponse<TmdbMovie>>('/search/movie', {
    query,
    include_adult: 'false',
    language: 'en-US',
  })

  let results = data.results
  if (genreId) {
    results = results.filter((movie) => movie.genre_ids.includes(genreId))
  }
  return applySort(results, sortBy)
}

export async function discoverMovies(sortBy: string, genreId?: number) {
  const data = await tmdbFetch<ListResponse<TmdbMovie>>('/discover/movie', {
    include_adult: 'false',
    language: 'en-US',
    sort_by: sortBy,
    with_genres: genreId,
  })
  return data.results
}

export async function fetchUpcoming() {
  const data = await tmdbFetch<ListResponse<TmdbMovie>>('/movie/upcoming', {
    language: 'en-US',
    region: 'US',
  })
  return data.results
}

export function getPosterUrl(path: string | null) {
  return path ? `${IMAGE_BASE}${path}` : ''
}

function applySort(list: TmdbMovie[], sortBy: string) {
  switch (sortBy) {
    case 'release_date.desc':
      return [...list].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
    case 'vote_average.desc':
      return [...list].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    default:
      return list
  }
}
