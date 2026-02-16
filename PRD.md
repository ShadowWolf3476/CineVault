1. Product Overview
1.1 Vision

CinéVault is a premium, modern dashboard-style movie tracker built for casual movie watchers of all ages. It enables users to:

Track watched movies

Rate and edit ratings

Save movies to “Plan to Watch”

Discover personalized recommendations

Explore upcoming releases

All without requiring login, using local storage for persistence.

The experience emphasizes elegance, clarity, and intelligent personalization with a high-end dashboard aesthetic.

2. Problem Statement

Casual movie watchers commonly experience:

1️⃣ Forgetting What They’ve Watched

No centralized tracking

Rewatching unintentionally

Forgetting ratings or opinions

2️⃣ Difficulty Discovering Good Movies

Overwhelming catalog choices

Generic recommendations

Cluttered user interfaces

CinéVault solves this by:

Providing frictionless tracking (no account required)

Delivering intelligent genre-based recommendations

Maintaining a premium, structured dashboard experience

Persisting data locally for simplicity

3. Target Users
Primary Audience:

Casual movie watchers of all ages

Characteristics:

Watch movies occasionally or weekly

Want a simple tracking solution

Appreciate a premium interface

Prefer no account creation

Use both desktop and mobile

4. Product Goals & Success Metrics
4.1 Goals

Enable fast movie tracking (<10 seconds to save)

Provide meaningful recommendations after 5 watched movies

Deliver smooth and responsive UI

Maintain consistent premium design across themes

4.2 Success Metrics

80%+ users interact with recommendation section

<2% UI confusion in usability tests

100% feature parity across light and dark modes

Mobile responsiveness across major devices

5. Technical Stack

Frontend: React + TypeScript

Build Tool: Vite

API: TMDB

API Key: VITE_TMDB_API_KEY=0431f0cff720c4dd6df18d42e25c3acb

State Management: React Context / Zustand

Persistence: Browser Local Storage

Styling: TailwindCSS (recommended)

6. Core Features
6.1 Search & Discovery
Functional Requirements

Search by title

Filter by genre

Sort by:

Popularity

Release date

Rating

Movie Cards Display:

Poster

Title

Year

TMDB rating

Genre tags

6.2 Classification System

Users can classify movies as:

✅ Watched

🎯 Plan to Watch

When marking as Watched:

Mandatory 1–5 star rating

Optional notes field

Editable later

Stored in local storage

6.3 Rating System

5-star interactive system

Editable anytime

Used in recommendation weighting

6.4 Personalized Recommendations (Intermediate Logic)
Recommendation Algorithm

Extract genres from watched movies

Weight genres by:

Frequency watched

Average user rating per genre

Boost:

Similar directors (if available)

Filter out:

Already watched movies

Use TMDB popularity as secondary sorting signal

Displayed under:
“Recommended For You”

6.5 Upcoming Releases

TMDB /movie/upcoming

Sorted by release date

Dedicated homepage section

Release date highlighted

7. Home Screen Layout
Top Section

Centered premium search bar

Genre filter dropdown

Sort dropdown

Light/Dark mode toggle (top-right)

Scroll Sections

🎯 Recommended For You

🎬 Upcoming Releases

Optional (future): Trending Now

8. Theme System (Light & Dark Mode Toggle)
8.1 Theme Switching Feature
Functional Requirements:

Toggle switch in top-right corner

Smooth animated transition

Persist theme preference in local storage

Default mode: Dark Mode (Premium emphasis)

Technical:

Use Tailwind theme config or CSS variables

Store theme: "light" | "dark" in local storage

Apply class to root <html> or <body>

9. Design System & Color Specifications
🌙 Dark Mode (Primary Premium Mode)

Theme Identity: Luxury Dashboard

Element	Color
Background	Navy Black #212121
Primary Accent	Gold #FFD700
Secondary Accent	Deep Plum #660066
Card Background	#2A2A2A
Primary Text	#F5F5F5
Muted Text	#AAAAAA
Usage Rules:

Gold for:

Buttons

Active states

Ratings

Highlights

Deep Plum for:

Secondary buttons

Hover effects

Section accents

Visual Effects:

Subtle gold glow on hover

Soft shadow elevation

Smooth card lift animation

☀️ Light Mode

Theme Identity: Clean Editorial Dashboard

Element	Color
Background	Beige #F0F0F0
Primary Accent	Rich Red #FF3737
Secondary Accent	Deep Forest #228B22
Card Background	#FFFFFF
Primary Text	#333333
Muted Text	#666666
Usage Rules:

Rich Red for:

Primary buttons

Active states

CTA highlights

Deep Forest for:

Tags

Secondary highlights

Success indicators

10. Data Architecture
Local Storage Structure
{
  theme: "light" | "dark",
  watched: [
    {
      id: number,
      title: string,
      poster: string,
      genres: number[],
      userRating: number,
      notes?: string,
      dateWatched: string
    }
  ],
  planToWatch: [
    {
      id: number,
      title: string,
      poster: string,
      genres: number[],
      addedDate: string
    }
  ]
}

11. Application Architecture
Folder Structure
src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── context/
 │     ├── ThemeContext.tsx
 │     ├── MovieContext.tsx
 ├── services/
 │     └── tmdb.ts
 ├── utils/
 ├── types/
 ├── theme/

12. Non-Functional Requirements

Fully responsive

Fast loading (<2s)

Lazy-loaded images

Skeleton loaders

Accessible contrast ratios

Graceful TMDB error handling

13. MVP Scope

Included:

Search

Filters

Watched list

Plan to watch

Editable ratings

Intermediate recommendations

Upcoming releases

Persistent local storage

Light/Dark theme toggle

Premium design system

Excluded:

Login/accounts

Backend

Social features

Cloud sync

14. Final Positioning

CinéVault is:

Premium but simple

Personalized but frictionless

Elegant but practical

Intelligent but not overwhelming

It provides the structure of a dashboard with the beauty of a luxury streaming experience — without forcing users to create an account.