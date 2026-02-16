import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  discoverMovies,
  fetchGenres,
  fetchUpcoming,
  getPosterUrl,
  searchMovies,
  type TmdbGenre,
  type TmdbMovie,
} from './services/tmdb'

type MovieCard = {
  id: number
  title: string
  year: string
  rating: number
  genres: string[]
  runtime: string
  poster: string
  overview?: string
}

type WatchedItem = {
  id: number
  title: string
  poster: string
  genres: string[]
  userRating: number
  notes?: string
  dateWatched: string
  year?: string
  overview?: string
}

type PlanItem = {
  id: number
  title: string
  poster: string
  genres: string[]
  addedDate: string
  year?: string
  overview?: string
}

const watchedSeed: WatchedItem[] = [
  {
    id: 21,
    title: 'Quiet Voltage',
    year: '2020',
    userRating: 4.5,
    genres: ['Indie', 'Drama'],
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&auto=format&fit=crop',
    dateWatched: new Date().toISOString(),
  },
  {
    id: 22,
    title: 'Neon Hymn',
    year: '2019',
    userRating: 4.0,
    genres: ['Music', 'Biography'],
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&auto=format&fit=crop',
    dateWatched: new Date().toISOString(),
  },
]

const planToWatchSeed: PlanItem[] = [
  {
    id: 31,
    title: 'Tideline Echo',
    year: '2024',
    genres: ['Drama'],
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=400&auto=format&fit=crop',
    addedDate: new Date().toISOString(),
  },
]

const STORAGE_KEYS = {
  watched: 'watched',
  plan: 'planToWatch',
}

function StarRating({ value }: { value: number }) {
  const stars = useMemo(() => {
    const full = Math.floor(value)
    const hasHalf = value - full >= 0.5
    return Array.from({ length: 5 }, (_, i) => {
      if (i < full) return 'full'
      if (i === full && hasHalf) return 'half'
      return 'empty'
    })
  }, [value])

  return (
    <div className="stars" aria-label={`Rated ${value} out of 5`}>
      {stars.map((state, i) => (
        <span key={i} className={`star ${state}`}></span>
      ))}
      <span className="rating-number">{value.toFixed(1)}</span>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [genres, setGenres] = useState<TmdbGenre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [query, setQuery] = useState('')
  const [recommended, setRecommended] = useState<MovieCard[]>([])
  const [upcoming, setUpcoming] = useState<MovieCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [watched, setWatched] = useState<WatchedItem[]>([])
  const [planToWatch, setPlanToWatch] = useState<PlanItem[]>([])
  const [activeLog, setActiveLog] = useState<{
    mode: 'add' | 'edit'
    movie: { id: number; title: string; poster: string; genres: string[]; year?: string; overview?: string }
  } | null>(null)
  const [logRating, setLogRating] = useState(4)
  const [logNotes, setLogNotes] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'plan' | 'watched'>('all')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [activeDetails, setActiveDetails] = useState<{
    id: number
    title: string
    overview: string
    poster?: string
    year?: string
    genres?: string[]
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      document.documentElement.dataset.theme = saved
    } else {
      document.documentElement.dataset.theme = 'dark'
    }
  }, [])

  useEffect(() => {
    const storedWatched = readStorage<WatchedItem[]>(STORAGE_KEYS.watched)
    const storedPlan = readStorage<PlanItem[]>(STORAGE_KEYS.plan)
    setWatched(storedWatched.length ? storedWatched : watchedSeed)
    setPlanToWatch(storedPlan.length ? storedPlan : planToWatchSeed)
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.watched, watched)
  }, [watched])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.plan, planToWatch)
  }, [planToWatch])

  useEffect(() => {
    let alive = true
    fetchGenres()
      .then((data) => {
        if (alive) setGenres(data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        const [rec, up] = await Promise.all([
          discoverMovies(sortBy, selectedGenre),
          fetchUpcoming(),
        ])
        if (!alive) return
        setRecommended(mapMovies(rec, genres))
        setUpcoming(mapMovies(up, genres, true))
      } catch (err) {
        if (alive) setError('Unable to load TMDB data. Check your API key and try again.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [genres, selectedGenre, sortBy])

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)
    setError('')
    try {
      const results = await searchMovies(query, sortBy, selectedGenre)
      setRecommended(mapMovies(results, genres))
    } catch (err) {
      setError('Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const openDetails = (movie: { id: number; title: string; overview?: string; poster?: string; year?: string; genres?: string[] }) => {
    if (!movie.overview) return
    setActiveDetails({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster: movie.poster,
      year: movie.year,
      genres: movie.genres,
    })
  }

  const getStatusLabel = (id: number) => {
    if (watched.some((item) => item.id === id)) return 'Watched'
    if (planToWatch.some((item) => item.id === id)) return 'Saved for later'
    return 'None'
  }


  const addToPlan = (movie: MovieCard) => {
    if (planToWatch.some((item) => item.id === movie.id) || watched.some((item) => item.id === movie.id)) {
      return
    }
    const next: PlanItem = {
      id: movie.id,
      title: movie.title,
      poster: movie.poster,
      genres: movie.genres,
      year: movie.year,
      overview: movie.overview,
      addedDate: new Date().toISOString(),
    }
    setPlanToWatch((prev) => [next, ...prev])
  }

  const openLogForMovie = (movie: { id: number; title: string; poster: string; genres: string[]; year?: string; overview?: string }, mode: 'add' | 'edit') => {
    setActiveLog({ movie, mode })
    if (mode === 'edit') {
      const existing = watched.find((item) => item.id === movie.id)
      setLogRating(existing?.userRating ?? 4)
      setLogNotes(existing?.notes ?? '')
    } else {
      setLogRating(4)
      setLogNotes('')
    }
  }

  const saveLog = () => {
    if (!activeLog) return
    const payload: WatchedItem = {
      id: activeLog.movie.id,
      title: activeLog.movie.title,
      poster: activeLog.movie.poster,
      genres: activeLog.movie.genres,
      year: activeLog.movie.year,
      overview: activeLog.movie.overview,
      userRating: logRating,
      notes: logNotes.trim() ? logNotes.trim() : undefined,
      dateWatched: new Date().toISOString(),
    }

    setWatched((prev) => {
      const filtered = prev.filter((item) => item.id !== payload.id)
      return [payload, ...filtered]
    })
    setPlanToWatch((prev) => prev.filter((item) => item.id !== payload.id))
    setActiveLog(null)
  }

  const averageRating = watched.length
    ? watched.reduce((sum, movie) => sum + movie.userRating, 0) / watched.length
    : 0

  const filteredLibrary = useMemo(() => {
    const normalized = [
      ...watched.map((item) => ({
        id: item.id,
        title: item.title,
        poster: item.poster,
        genres: item.genres,
        year: item.year,
        status: 'watched' as const,
        date: item.dateWatched,
        userRating: item.userRating,
        notes: item.notes,
        overview: item.overview,
      })),
      ...planToWatch.map((item) => ({
        id: item.id,
        title: item.title,
        poster: item.poster,
        genres: item.genres,
        year: item.year,
        status: 'plan' as const,
        date: item.addedDate,
        overview: item.overview,
      })),
    ]

    const queryText = libraryQuery.trim().toLowerCase()
    const filtered = normalized.filter((item) => {
      if (libraryFilter !== 'all' && item.status !== libraryFilter) return false
      if (!queryText) return true
      const haystack = `${item.title} ${item.genres.join(' ')}`.toLowerCase()
      return haystack.includes(queryText)
    })

    return filtered.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [libraryFilter, libraryQuery, planToWatch, watched])

  return (
    <div className="page">
      <header className="top-bar">
        <div className="brand">
          <div className="logo-mark">
            <svg viewBox="0 0 64 64" role="img" aria-label="CineVault logo">
              <defs>
                <linearGradient id="gold" x1="0" x2="1">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-strong)" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="28" fill="none" stroke="url(#gold)" strokeWidth="2" />
              <path d="M20 36c5-9 19-14 26-14 0 10-6 20-14 22-8 2-12-2-12-8z" fill="url(#gold)" />
              <path d="M22 20h20" stroke="url(#gold)" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 26h28" stroke="url(#gold)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="brand-title">CineVault</p>
            <p className="brand-subtitle">Premium movie tracking, no account required.</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="chip" onClick={() => { setLibraryFilter('plan'); scrollToSection('library') }}>
            Plan to Watch
          </button>
          <button className="chip outline" onClick={() => { setLibraryFilter('watched'); scrollToSection('library') }}>
            Watched
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-left">
          <h1>Track every film. Surface the ones worth your time.</h1>
          <p>
            A refined dashboard for casual movie fans. Save what you love, rate with confidence, and let
            your taste shape smart recommendations.
          </p>
          <div className="search-panel">
            <div className="search-field">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path
                    d="M16.5 16.5l4 4M4 11a7 7 0 1 0 14 0 7 7 0 0 0-14 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                placeholder="Search titles, directors, or keywords"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary" onClick={handleSearch}>Search</button>
            </div>
            <div className="filters">
              <select onChange={(event) => setSelectedGenre(toOptionalNumber(event.target.value))}>
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="popularity.desc">Sort: Popularity</option>
                <option value="release_date.desc">Sort: Release Date</option>
                <option value="vote_average.desc">Sort: Rating</option>
              </select>
              <button className="ghost" onClick={handleSearch}>Advanced Filters</button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
        <div className="hero-right">
          <div className="stat-card">
            <p className="stat-label">Movies Watched</p>
            <p className="stat-value">{watched.length}</p>
            <p className="stat-note">Your last entry {watched[0]?.title ?? ' - '}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Average Rating</p>
            <p className="stat-value">{averageRating ? averageRating.toFixed(1) : ' - '}</p>
            <p className="stat-note">Based on your saved ratings</p>
          </div>
          <div className="stat-card highlight">
            <p className="stat-label">Next to Watch</p>
            <p className="stat-value">{planToWatch[0]?.title ?? 'Add a film'}</p>
            <p className="stat-note">Saved {planToWatch.length} titles</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Recommended For You</h2>
            <p>Based on your ratings and genre affinity.</p>
          </div>
          <button className="ghost" onClick={handleSearch}>Refresh</button>
        </div>
        <div className="grid">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div className="movie-card skeleton" key={`sk-${i}`} />
          ))}
          {!loading && recommended.map((movie) => (
            <article
              className="movie-card"
              key={movie.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(movie)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openDetails(movie)
              }}
            >
              <div className="poster" style={{ backgroundImage: `url(${movie.poster})` }}>
                <span className="runtime">{movie.runtime}</span>
              </div>
              <div className="movie-meta">
                <div>
                  <h3>{movie.title}</h3>
                  <p className="movie-sub">{movie.year} - {movie.genres.join(' - ')}</p>
                </div>
                <div className="row">
                  <div className="tmdb">
                    <span>TMDB</span>
                    <strong>{movie.rating.toFixed(1)}</strong>
                  </div>
                  <div className="row">
                    <button
                      className="ghost small action-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        addToPlan(movie)
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="ghost small action-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        openLogForMovie(movie, 'add')
                      }}
                    >
                      Mark Watched
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <div className="section-head">
            <div>
              <h2>Upcoming Releases</h2>
              <p>Fresh arrivals from TMDB, sorted by release date.</p>
            </div>
            <button className="ghost">Calendar</button>
          </div>
          <div className="upcoming">
            {upcoming.map((movie) => (
              <div
                className="upcoming-row"
                key={movie.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetails(movie)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') openDetails(movie)
                }}
              >
                <div className="poster mini" style={{ backgroundImage: `url(${movie.poster})` }} />
                <div>
                  <p className="movie-title">{movie.title}</p>
                  <p className="movie-sub">{movie.genres.join(' - ')}</p>
                </div>
                <span className="date-pill">{movie.runtime}</span>
                <button
                  className="ghost small action-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    addToPlan(movie)
                  }}
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>
                <aside className="side-panel">
          <div className="side-section">
            <h3>Your Ratings</h3>
            {watched.slice(0, 2).map((movie) => (
              <div className="rating-item" key={movie.id}>
                <div>
                  <p className="movie-title">{movie.title}</p>
                  <p className="movie-sub">{movie.genres.join(' - ')}</p>
                </div>
                <StarRating value={movie.userRating} />
              </div>
            ))}
          </div>
        </aside>
      </section>

      
      <section className="section" id="library">
        <div className="section-head">
          <div>
            <h2>Your Library</h2>
            <p>Plan and watched titles in one unified view.</p>
          </div>
          <div className="library-controls">
            <div className="library-filters">
              <button
                className={libraryFilter === 'all' ? 'chip' : 'chip outline'}
                onClick={() => setLibraryFilter('all')}
              >
                All
              </button>
              <button
                className={libraryFilter === 'plan' ? 'chip' : 'chip outline'}
                onClick={() => setLibraryFilter('plan')}
              >
                Plan
              </button>
              <button
                className={libraryFilter === 'watched' ? 'chip' : 'chip outline'}
                onClick={() => setLibraryFilter('watched')}
              >
                Watched
              </button>
            </div>
            <input
              className="library-search"
              placeholder="Filter by title or genre"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="library-grid">
          {filteredLibrary.map((item) => (
            <div
              className="library-card"
              key={`${item.status}-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openDetails(item)
              }}
            >
              <div className="poster mini" style={{ backgroundImage: `url(${item.poster})` }} />
              <div className="library-body">
                <div className="library-top">
                  <p className="movie-title">{item.title}</p>
                  <span className={`status-pill ${item.status}`}>
                    {item.status === 'watched' ? 'Watched' : 'Plan'}
                  </span>
                </div>
                <p className="movie-sub">{item.year ?? '-'} - {item.genres.join(' - ')}</p>
                <p className="library-meta">
                  {item.status === 'watched'
                    ? `Watched ${formatDate(item.date)}`
                    : `Added ${formatDate(item.date)}`}
                </p>
                {item.status === 'watched' && item.userRating !== undefined && (
                  <StarRating value={item.userRating} />
                )}
                {item.notes && <p className="movie-notes">{item.notes}</p>}
              </div>
              <div className="library-actions">
                {item.status === 'plan' ? (
                  <button
                    className="ghost small action-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      openLogForMovie(
                        {
                          id: item.id,
                          title: item.title,
                          poster: item.poster,
                          genres: item.genres,
                          year: item.year,
                          overview: item.overview,
                        },
                        'add'
                      )
                    }}
                  >
                    Mark Watched
                  </button>
                ) : (
                  <button
                    className="ghost small action-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      openLogForMovie(
                        {
                          id: item.id,
                          title: item.title,
                          poster: item.poster,
                          genres: item.genres,
                          year: item.year,
                          overview: item.overview,
                        },
                        'edit'
                      )
                    }}
                  >
                    Edit Notes
                  </button>
                )}
              </div>
            </div>
          ))}
          {!filteredLibrary.length && (
            <div className="empty-state">
              <p>No titles match these filters yet.</p>
            </div>
          )}
        </div>
      </section>

      {activeLog && (
        <div className="log-drawer" role="dialog" aria-modal="true">
          <div className="log-card">
            <div className="log-header">
              <div>
                <p className="log-title">{activeLog.movie.title}</p>
                <p className="movie-sub">{activeLog.movie.genres.join(' - ')}</p>
              </div>
              <button className="ghost small" onClick={() => setActiveLog(null)}>Close</button>
            </div>
            <div className="log-body">
              <label>
                Rating (1-5)
                <select value={logRating} onChange={(event) => setLogRating(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  rows={4}
                  placeholder="Add quick notes (optional)"
                  value={logNotes}
                  onChange={(event) => setLogNotes(event.target.value)}
                />
              </label>
            </div>
            <div className="log-actions">
              <button className="ghost" onClick={() => setActiveLog(null)}>Cancel</button>
              <button className="primary" onClick={saveLog}>
                {activeLog.mode === 'edit' ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeDetails && (
        <div className="detail-drawer" role="dialog" aria-modal="true">
          <div className="detail-card">
            <div className="detail-header">
              <div>
                <p className="log-title">{activeDetails.title}</p>
                <p className="movie-sub">
                  {activeDetails.year ?? ''}{activeDetails.genres?.length ? ` - ${activeDetails.genres.join(' - ')}` : ''}
                </p>
              </div>
              <button className="ghost small" onClick={() => setActiveDetails(null)}>Close</button>
            </div>
            <div className="detail-body">
              {activeDetails.poster && (
                <div className="poster detail" style={{ backgroundImage: `url(${activeDetails.poster})` }} />
              )}
              <div className="detail-copy">
                <div className="detail-status">
                  <span>Status</span>
                  <strong>{getStatusLabel(activeDetails.id)}</strong>
                </div>
                <p>{activeDetails.overview}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function mapMovies(list: TmdbMovie[], genres: TmdbGenre[], isUpcoming = false): MovieCard[] {
  const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]))
  return list.slice(0, 8).map((movie) => {
    const year = movie.release_date ? movie.release_date.split('-')[0] : ' - '
    const displayGenres = movie.genre_ids.map((id) => genreMap.get(id)).filter(Boolean) as string[]
    return {
      id: movie.id,
      title: movie.title,
      year,
      rating: movie.vote_average ? Number((movie.vote_average / 2).toFixed(1)) : 0,
      genres: displayGenres.length ? displayGenres.slice(0, 2) : ['Unknown'],
      runtime: isUpcoming && movie.release_date ? formatDate(movie.release_date) : `${year}`,
      poster: getPosterUrl(movie.poster_path) ||
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=600&auto=format&fit=crop',
      overview: movie.overview?.trim() ? movie.overview : undefined,
    }
  })
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.valueOf())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function toOptionalNumber(value: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function readStorage<T>(key: string): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return [] as T
    return JSON.parse(raw) as T
  } catch {
    return [] as T
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // no-op
  }
}

export default App
