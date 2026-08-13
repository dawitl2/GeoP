# geoP — Master Project Context

## IMPORTANT: READ BEFORE DOING ANYTHING

This document is **PROJECT CONTEXT ONLY**.

Do **NOT**:

* create files;
* modify files;
* install packages;
* run commands;
* scaffold applications;
* write implementation code;
* create database schemas;
* call external APIs;
* begin Level 1;
* assume that any level is approved;
* automatically continue to another level.

After reading this document, **wait for the next explicit prompt**.

The levels below describe the current vision for the project. They are **NOT a mandatory execution sequence**.

During development we may:

* change a level;
* remove a level;
* split a level;
* combine levels;
* add new levels;
* implement only part of a level;
* jump forward;
* return to an earlier level;
* replace a technology;
* change a feature.

When a future prompt says something such as:

> Implement Level 1

only implement the exact scope given in that prompt.

Do not implement future-level functionality unless it is technically necessary for the requested level.

---

# 1. PROJECT NAME

**geoP**

---

# 2. CORE IDEA

geoP is a **global interactive geopolitical intelligence and exploration platform**.

It should allow someone to visually explore the world and quickly understand:

* countries;
* continents;
* geographic regions;
* geopolitical relationships;
* conflicts;
* territorial disputes;
* diplomatic disputes;
* economic relationships;
* international trade;
* current events;
* historical context;
* political leaders;
* official statements;
* news coverage;
* how different media sources describe the same issue;
* how a situation developed over time;
* which countries, governments, organizations and actors are involved.

The project should feel closer to an **interactive geopolitical intelligence system** than a normal news website.

---

# 3. PRIMARY EXPERIENCE

When geoP opens, the user should initially see a **3D interactive globe**.

The globe should be the main navigation experience.

The user should be able to:

* rotate the Earth;
* zoom in/out;
* hover countries;
* click countries;
* search;
* select continents;
* select regions;
* discover active geopolitical topics;
* select conflicts/disputes;
* move smoothly between geographic areas.

Conceptually:

```text
                         geoP

                    INTERACTIVE GLOBE

              rotate • zoom • explore

        ┌───────────────────────────────┐
        │     geopolitical activity    │
        │                              │
        │             🌍               │
        │                              │
        └───────────────────────────────┘

 Search...

 World
 Africa
 Asia
 Europe
 Americas
 Oceania

 Trending / Active Topics
```

The experience should be highly visual but **not become a strategy-game map**.

Animations should communicate information rather than merely decorate the globe.

---

# 4. EXPLORATION MODEL

Users can explore geographically:

```text
WORLD
  ↓
CONTINENT
  ↓
REGION
  ↓
COUNTRY / POLITICAL ENTITY
  ↓
TOPIC
  ↓
DETAILED INFORMATION
```

But topics are not required to belong to only one country.

A geopolitical topic can connect many entities.

For example:

```text
NILE / GERD

               Ethiopia
                   │
                   │
Egypt ────────── GERD ───────── Sudan
                   │
                   │
              Nile Basin
```

Another topic may concern:

```text
Russia
Ukraine
European Union
NATO
United States
other involved actors
```

Another may concern:

```text
China
Taiwan
United States
Japan
regional actors
```

Therefore **Topic** must be a first-class domain object, not a property inside a Country object.

---

# 5. TYPES OF TOPICS geoP SHOULD EVENTUALLY SUPPORT

Examples include:

```text
ARMED_CONFLICT
TERRITORIAL_DISPUTE
DIPLOMATIC_DISPUTE
GEOPOLITICAL_TENSION
WATER_DISPUTE
TRADE_DISPUTE
SANCTIONS
ALLIANCE
SECURITY_ISSUE
POLITICAL_CRISIS
ECONOMIC_CRISIS
ELECTION
ENERGY
MIGRATION
MARITIME_DISPUTE
BORDER_DISPUTE
REGIONAL_RELATIONSHIP
```

The architecture should remain extensible.

---

# 6. GLOBAL COVERAGE

geoP is a **global system**.

Do NOT design the database around only the 193 UN member states.

A geographic/political entity may be:

```text
SOVEREIGN_STATE
PARTIALLY_RECOGNIZED_STATE
DE_FACTO_STATE
DEPENDENCY
TERRITORY
DISPUTED_TERRITORY
SPECIAL_REGION
AUTONOMOUS_REGION
HISTORICAL_ENTITY
OTHER
```

The application's internal IDs must therefore **not depend on ISO codes**.

Example:

```text
GeoEntity

id: UUID
slug
canonicalName
displayName

entityType

isoAlpha2: nullable
isoAlpha3: nullable
wikidataId: nullable

continent
region
parentEntity: nullable

geometry
aliases[]

recognitionInformation
boundarySource
sourceReferences[]

validFrom: nullable
validUntil: nullable

createdAt
updatedAt
```

This allows geoP to support entities that do not have standard ISO country codes.

It also means a newly created or newly recognized political entity can be added to geoP without redesigning the database.

### Important

No external dataset can be assumed to perfectly define every disputed or newly emerging political entity.

Therefore geoP should eventually have its own **GeoEntity Registry** constructed from public geographic datasets plus curated overrides.

---

# 7. POLITICAL NEUTRALITY AND DISPUTED BORDERS

This is extremely important.

geoP must not accidentally present a disputed geopolitical claim as universally accepted fact.

Every disputed geographic representation should have provenance.

The system should distinguish concepts such as:

```text
administrative control
international recognition
territorial claim
disputed territory
source representation
```

Natural Earth provides public-domain country/map-unit data and distinguishes de facto boundary representation while also providing point-of-view variants for various disputes.

Therefore boundary data should eventually include:

```text
source
version
representationType
retrievedAt
notes
```

geoP should describe disputes, not silently choose a political position.

---

# 8. INFORMATION PROVENANCE

geoP should never present everything as:

> geoP says X.

Information should have provenance.

Every significant item should eventually be classifiable as something such as:

```text
FACTUAL_DATA
MEDIA_REPORT
OFFICIAL_STATEMENT
CLAIM
HISTORICAL_CONTEXT
DATASET_EVENT
ANALYSIS
```

And store:

```text
source
sourceType
sourceCountry
originalURL
publishedAt
retrievedAt
provider
language
```

The interface should make a distinction between:

> A government stated X.

and:

> A news outlet reported X.

and:

> Dataset Y recorded event X.

These are not equivalent.

---

# 9. MEDIA COMPARISON PRINCIPLE

One of geoP's major features should eventually be:

**How different sources are covering the same event.**

Do not automatically label a source as:

```text
TRUE
FALSE
PRO_COUNTRY_X
ANTI_COUNTRY_Y
PROPAGANDA
```

unless future functionality has an explicit, defensible methodology.

Prefer observable comparisons:

```text
Topics emphasized
People mentioned
Organizations mentioned
Headline wording
Article volume
Publication timing
Locations mentioned
Common terminology
```

Example:

```text
GERD — Coverage Comparison

International Sources
─────────────────────
frequent themes:
negotiations
water security
regional diplomacy


Ethiopian Sources
─────────────────────
frequent themes:
energy
development
sovereignty


Egyptian Sources
─────────────────────
frequent themes:
water security
Nile rights
national security
```

The user should be able to open the original sources.

---

# 10. APPROVED TECHNOLOGY DIRECTION

Exact package versions should be selected from the latest stable mutually compatible releases **when implementation actually begins**.

Do not pin future versions inside this planning document.

## Monorepo

```text
pnpm workspaces
```

Potential structure:

```text
geoP/

apps/
  web/
  api/

packages/
  contracts/
  config/
  geo-data/
  tooling/

docs/

docker/
```

Do not create this yet.

---

# 11. FRONTEND STACK

```text
Next.js
React
TypeScript

MapLibre GL JS
Tailwind CSS

Zustand
TanStack Query

Apache ECharts
```

Additional visualization libraries may be introduced only when a future requirement justifies them.

---

# 12. GLOBE TECHNOLOGY

Use:

**MapLibre GL JS**

MapLibre GL JS is an open-source TypeScript mapping engine using WebGL and currently supports globe rendering.

So the choice is effectively:

```text
MapLibre GL JS
       ↓
     WebGL
       ↓
GPU rendered globe
```

Do NOT build the entire globe engine manually using raw WebGL.

Do NOT initially build a custom Three.js Earth unless a later visual requirement cannot reasonably be implemented through MapLibre.

Possible later addition:

```text
deck.gl
```

for specialized:

* arcs;
* animated connections;
* event overlays;
* large geospatial datasets.

Only add it if required.

---

# 13. MAP DATA STRATEGY

Avoid a paid map provider.

Initial world geometry should come from public/open geographic datasets.

## Natural Earth

Use for:

* world polygons;
* countries;
* map units;
* major geographic features;
* low/medium/high resolution levels.

Natural Earth is public-domain and its Admin-0 country dataset currently contains 258 country/map entities.

## geoBoundaries

Potentially use for:

* detailed ADM0 boundaries;
* ADM1;
* ADM2;
* deeper country navigation.

geoBoundaries provides an open CC BY 4.0 global administrative-boundary dataset covering more than 200 entities.

Attribution requirements must be respected.

---

# 14. BACKEND STACK

The backend is one of the **main purposes of this project**.

Use:

```text
NestJS
TypeScript

PostgreSQL
Prisma

Redis

BullMQ

NestJS Schedule

NestJS WebSocket Gateways

Swagger / OpenAPI

JWT authentication later

Docker
```

NestJS must appear **immediately**, not after the frontend is complete.

Even the earliest working geoP version should have:

```text
Frontend
   ↓
NestJS API
   ↓
backend response
```

This project is intentionally being used to gain serious NestJS experience.

---

# 15. EXTERNAL DATA RULE

For the current project direction:

**ONLY FREE DATA SOURCES / FREE API ACCESS MAY BE USED.**

Do not introduce:

* paid APIs;
* paid map providers;
* paid LLM APIs;
* paid news APIs;
* X/Twitter paid API;
* services requiring billing information to function;
* a dependency that makes the application stop working once a trial expires.

A free API key is acceptable if no paid subscription is required.

All third-party API calls should eventually pass through NestJS rather than exposing service credentials to the browser.

---

# 16. APPROVED DATA SOURCES

## A. GDELT

Primary use:

```text
global news
events
geopolitical activity
locations
people
organizations
themes
media coverage
historical event analysis
near-real-time developments
```

GDELT states that its database is free/open, its global event archive stretches back to 1979, and its event data is continually updated.

Potential GDELT components:

```text
DOC API
GEO API
Context API
Event Database
GKG
```

Official research location:

```text
gdeltproject.org
```

---

## B. World Bank Indicators API

Primary use:

```text
GDP
GDP growth
population
inflation-related indicators
development indicators
debt-related indicators
trade indicators
energy indicators
other country statistics
```

The World Bank Indicators API does not require an API key.

Official research location:

```text
datahelpdesk.worldbank.org
data.worldbank.org
```

---

## C. UN Comtrade

Primary use:

```text
imports
exports
trading partners
products
bilateral trade
trade balance
historical trade
```

The current free account advertises a free API key with up to 500 API calls per day and up to 100,000 records per call.

Because this has limits, geoP must:

```text
cache results
avoid repeated requests
store historical data
schedule refreshes intelligently
```

Official research location:

```text
comtradeplus.un.org
```

---

## D. Wikimedia / Wikipedia APIs

Primary use:

```text
country context
basic history
historical background
topic introductions
reference links
basic entity descriptions
```

Wikimedia provides open API access to Wikimedia content.

Do not blindly copy entire Wikipedia articles into geoP.

Prefer:

```text
structured references
short context
source attribution
links
locally normalized metadata
```

Official research location:

```text
mediawiki.org
wikipedia.org
```

---

## E. Wikidata

Primary use:

```text
structured entities
aliases
leaders / offices
organizations
dates
historical relationships
geographic metadata
linked entities
identifiers
```

Wikidata provides its SPARQL Query Service for structured queries.

Wikidata information can change and should store:

```text
retrievedAt
source
wikidataId
```

Official research location:

```text
wikidata.org
query.wikidata.org
```

---

## F. UCDP — Uppsala Conflict Data Program

Use for structured conflict history.

Potential data:

```text
armed conflicts
organized violence
conflict actors
georeferenced events
historical conflict events
fatality estimates
conflict timelines
```

UCDP provides free dataset downloads, including its global Georeferenced Event Dataset, and documents REST API access.

This is useful because:

```text
GDELT
= media/event monitoring

UCDP
= structured conflict research dataset
```

They serve different purposes.

Official research location:

```text
ucdp.uu.se
```

---

# 17. HISTORY / CONTEXT STRATEGY

There is no single perfect "history API."

geoP should combine several sources.

```text
Wikimedia
      │
      ├── descriptive historical context
      │
Wikidata
      │
      ├── structured historical facts/entities
      │
UCDP
      │
      ├── conflict history
      │
GDELT
      │
      └── event/media history from 1979+
```

Historical information must keep provenance.

---

# 18. HIGH-LEVEL SYSTEM ARCHITECTURE

Eventually:

```text
                    EXTERNAL SOURCES

        GDELT
        Wikidata
        Wikimedia
        World Bank
        UN Comtrade
        UCDP
           │
           │
           ▼

       ┌─────────────────────────┐
       │        NestJS API       │
       │                         │
       │ provider adapters       │
       │ ingestion              │
       │ normalization           │
       │ validation              │
       │ classification          │
       │ caching                 │
       │ topic matching          │
       │ source comparison       │
       │ auth later              │
       │ REST API                │
       │ WebSockets later        │
       └────────────┬────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼

     PostgreSQL             Redis
          │                   │
          └─────────┬─────────┘
                    │
                    ▼

                 Next.js
                    │
                    ▼

             MapLibre Globe
             Country pages
             Topic pages
             Charts
             Timelines
             News analysis
```

---

# 19. PROVIDER ARCHITECTURE

External services should not spread API-specific code throughout the application.

Use provider/adaptor boundaries conceptually such as:

```text
NewsProvider
ConflictProvider
TradeProvider
EconomicProvider
ContextProvider
GeoProvider
```

Example:

```text
GdeltProvider
      ↓
NewsProvider interface
      ↓
NewsService
```

This means another free provider could later replace or complement GDELT without rewriting the application.

---

# 20. CURRENT DEVELOPMENT LEVELS

Again:

**THESE LEVELS ARE PLANNING LABELS ONLY.**

Do not implement them from this document.

---

# LEVEL 1 — FOUNDATION + FIRST VISIBLE geoP

## Goal

Create the first working version of the application while introducing NestJS immediately.

The first implementation should not be months of invisible backend work.

At the same time, it must not be a standalone frontend mockup.

### Expected architecture

```text
Next.js
   │
   ▼
NestJS
   │
   ▼
PostgreSQL
```

and:

```text
Next.js
   │
   ▼
MapLibre Globe
```

## Frontend

Create the initial geoP visual shell:

```text
navigation
search area
3D globe
country hover
country selection
basic information panel
responsive layout
loading/error states
```

Use temporary/local geographic data.

Do not connect live geopolitical APIs yet unless specifically requested.

## Globe

First globe capabilities:

```text
rotate
zoom
country hover
country click
camera transition
basic country highlighting
continent navigation
```

## Backend

Create NestJS from day one.

Initial functionality may include:

```text
GET /api/v1/health

GET /api/v1/meta

GET /api/v1/geo/entities
```

The frontend should make at least one real request to the Nest API so the full-stack structure exists immediately.

## Database

Introduce:

```text
PostgreSQL
Prisma
```

but keep schema intentionally small.

## Main learning goals

```text
Nest application structure
Modules
Controllers
Services
Dependency Injection
Configuration
DTO basics
Prisma connection
Swagger
```

## Deliverable

A visually recognizable geoP application with:

```text
working globe
working frontend
working Nest backend
working database connection
working frontend → Nest communication
```

No live geopolitical intelligence yet.

---

# LEVEL 2 — GLOBAL GEOENTITY REGISTRY

## Goal

Make the globe understand the political/geographic world.

Build the normalized geographic hierarchy:

```text
World
Continent
Region
GeoEntity
Subregion
```

Use:

```text
Natural Earth
geoBoundaries where appropriate
Wikidata
curated overrides
```

## Important

The registry should support:

```text
states
territories
dependencies
de facto entities
partially recognized entities
disputed territories
future/new entities
```

Do not require an ISO code.

## Features

```text
select continent
select region
select entity
search aliases
navigate related entities
smooth globe focus
```

## Backend

Potential modules:

```text
GeoModule
ContinentModule
RegionModule
GeoEntityModule
```

Potential endpoints:

```text
GET /geo/continents
GET /geo/regions
GET /geo/entities
GET /geo/entities/:slug
GET /geo/search
```

## Nest learning

```text
modules
DTO validation
database relations
repositories/services
query parameters
pagination
seed/import scripts
error handling
```

## Deliverable

The complete globe becomes driven by the geoP backend rather than frontend hardcoded country definitions.

---

# LEVEL 3 — COUNTRY / ENTITY CONTEXT

## Goal

Clicking an entity should provide enough background to understand it.

Example:

```text
ETHIOPIA

Overview
Location
Capital
Population
Languages
Currency

Political context
Short modern history

Active geopolitical topics
Related entities
```

## Data

Potential providers:

```text
Wikidata
Wikimedia
World Bank for selected facts
```

## Do not

Create giant encyclopedia pages.

geoP should provide concise geopolitical context with links to deeper information.

## Sections

Potential structure:

```text
Overview
Context
History
Geopolitics
Topics
News
Economy
Trade
Statements
Timeline
Sources
```

Not all sections need implementation immediately.

## Nest learning

```text
external API service
provider adapters
normalization
caching
mapping external DTOs → internal models
```

## Deliverable

Every supported GeoEntity can open an information page/panel rather than simply being a shape on a map.

---

# LEVEL 4 — GEOPOLITICAL TOPIC ENGINE

## Goal

Create the core domain that makes geoP different from a country encyclopedia.

Create:

```text
Topic
Actor
ActorRole
TopicRelationship
TopicLocation
TopicTimeline
TopicSource
```

Example topics may include:

```text
Nile / GERD
Russia–Ukraine
Taiwan Strait
Iran–Israel
Sudan conflict
other global topics
```

These are examples, not hardcoded limits.

## Topic view

Potential sections:

```text
Overview
Actors
Map
History
Timeline
News
Statements
Coverage
Economy
Trade
Sources
```

## Actor model

Actors may be:

```text
Country
Government
Political entity
Organization
Military organization
International organization
Person
Other actor
```

Roles may include:

```text
primary actor
affected actor
mediator
ally
opponent
observer
international organization
other
```

Do not force every issue into exactly two "sides."

## Globe behavior

Selecting a topic may:

```text
focus the relevant geographic area
highlight involved entities
draw connections
show event markers
animate selected relationships
dim irrelevant areas
```

## Deliverable

geoP can represent complex multi-country geopolitical situations.

---

# LEVEL 5 — LIVE / NEAR-LIVE NEWS ENGINE

## Goal

Connect geoP to current global reporting.

Primary provider:

**GDELT**

## Data flow

```text
GDELT
   ↓
GdeltProvider
   ↓
NewsIngestionService
   ↓
Normalizer
   ↓
PostgreSQL
   ↓
Nest API
   ↓
geoP frontend
```

## Store

Conceptually:

```text
headline
source
sourceDomain
sourceCountry
language
publishedAt
originalURL

relatedEntities[]
relatedTopics[]
locations[]

provider
providerId

retrievedAt
```

## Requirements

Implement:

```text
deduplication
pagination
source attribution
error handling
rate-conscious fetching
scheduled refresh
query normalization
```

## Country view

Example:

```text
ETHIOPIA

Latest
Politics
Diplomacy
Conflict
Economy
Trade
Security
```

## Topic view

Example:

```text
NILE / GERD

Latest developments
Articles
Countries mentioned
People mentioned
Organizations mentioned
```

## Nest learning

```text
HttpModule
scheduled jobs
provider integrations
database ingestion
retry logic
logging
normalization
```

## Deliverable

geoP begins displaying real current global developments.

---

# LEVEL 6 — CONFLICT DATA + HISTORICAL EVENT MAP

## Goal

Add structured conflict information rather than relying only on headlines.

Use:

```text
UCDP
GDELT Events
```

for different purposes.

## UCDP

Use for:

```text
organized violence
conflict history
actors
georeferenced conflict events
historical patterns
```

## GDELT

Use for:

```text
near-real-time event reporting
media activity
geographic event signals
```

Do not pretend these datasets represent identical concepts.

## Globe

Potential visualization:

```text
event markers
conflict areas
time filtering
historical playback
event clusters
subtle animated activity
```

Potential filters:

```text
24 hours
7 days
30 days
1 year
historical
```

## Deliverable

The globe starts communicating actual geopolitical activity rather than merely highlighting countries.

---

# LEVEL 7 — MEDIA PERSPECTIVE / COVERAGE COMPARISON

## Goal

Show how reporting differs between sources.

Example:

```text
TOPIC: GERD

International Coverage
Ethiopian Coverage
Egyptian Coverage
Sudanese Coverage
```

Potential comparison metrics:

```text
headline terms
entities mentioned
themes
publication count
publication timing
locations
people
organizations
tone where methodology is explicit
```

## Article clustering

Related reports should be grouped into stories/events where possible.

Example:

```text
DEVELOPMENT X

Reuters
BBC
Al Jazeera
Source A
Source B
```

Then compare how each describes the development.

## Important

Do not have geoP automatically decide which source is telling "the truth."

It should expose:

```text
sources
claims
differences
context
```

## Nest learning

```text
background jobs
BullMQ
Redis
aggregation
classification
data pipelines
worker architecture
```

## Deliverable

A usable **Compare Coverage** feature.

---

# LEVEL 8 — ECONOMIC INTELLIGENCE

## Goal

Add economic context to countries and geopolitical topics.

Primary provider:

**World Bank Indicators API**

## Potential country data

```text
GDP
GDP growth
population
inflation indicators
debt indicators
trade-related indicators
energy indicators
development indicators
```

Only expose indicators we can explain correctly.

## UI

```text
charts
historical series
latest available year
source
units
metadata
```

Never display stale values as though they are real-time.

Always expose the data year.

## Topic integration

Example:

```text
GERD

Economic Context
────────────────
Energy
Population
GDP
regional economic dependence
```

Only claim causal relationships when a reliable source actually supports them.

## Deliverable

Countries and topics gain meaningful economic context.

---

# LEVEL 9 — INTERNATIONAL TRADE

## Goal

Show economic relationships between entities.

Primary provider:

**UN Comtrade**

## Country page

```text
Top export partners
Top import partners
Major exports
Major imports
Trade balance
Historical changes
```

## Bilateral relationship

Example:

```text
ETHIOPIA ↔ CHINA

Imports
Exports
Trade Balance
Major Products
Historical Trend
```

## Topic integration

Trade relationships may be shown for actors involved in a topic.

## Backend requirements

Because free API usage is limited:

```text
aggressive caching
database persistence
scheduled refresh
request deduplication
rate-limit awareness
```

## Nest learning

```text
cache strategies
rate limiting
scheduled ingestion
data transformations
complex queries
```

## Deliverable

geoP can explain not just political relationships but economic dependencies and trade links.

---

# LEVEL 10 — LEADERS, POLITICIANS AND OFFICIAL STATEMENTS

## Goal

Show what relevant governments and political actors are actually saying.

Potential entities:

```text
President
Prime Minister
Foreign Minister
Foreign Ministry
Government agency
International organization
Political organization
other officials
```

## Information model

```text
Person
Office
Organization
Statement
StatementSource
Topic
GeoEntity
```

A statement should store:

```text
speaker
office at the time
organization
date
topic
original source
statement type
retrievedAt
```

Do not assume someone's current political office forever.

Political roles must be time-aware.

## Views

Example:

```text
GERD

ETHIOPIA
Latest official position

EGYPT
Latest official position

SUDAN
Latest official position
```

Media reports about an official should remain separate from a direct official statement.

## Deliverable

Users can distinguish official positions from media interpretation.

---

# LEVEL 11 — TREND / DEVELOPING EVENT ENGINE

## Goal

Allow geoP to detect changes rather than merely list content.

Possible features:

```text
trending topics
coverage spikes
rapidly increasing entity mentions
new actor involvement
new official statement
new conflict event
new trade/economic release
```

Example:

```text
DEVELOPING

Iran / Israel

Coverage volume
+241% compared with baseline

Spike began
42 minutes ago
```

The methodology must be explainable.

Do not fabricate arbitrary "risk scores."

## "WHAT CHANGED?"

Potential feature:

```text
What changed in the past 24 hours?

3 official statements
27 new reports
coverage +82%
2 newly detected locations
1 new diplomatic development
```

## Realtime

Architecture may become:

```text
Providers
   ↓
Workers
   ↓
PostgreSQL / Redis
   ↓
NestJS
   ↓
WebSocket Gateway
   ↓
Next.js
```

## Nest learning

```text
WebSocket gateways
Redis
BullMQ
event-driven backend
background workers
scaling
```

## Deliverable

geoP begins to feel like a live intelligence application.

---

# LEVEL 12 — ACCOUNTS + RESEARCH WORKSPACE

## Goal

Only after the public product is useful should user accounts become important.

Potential functionality:

```text
register
login
logout
refresh tokens
profile
```

## Watchlists

Users could follow:

```text
countries
regions
topics
conflicts
leaders
```

## Saved research

A user could create:

```text
Research Workspace

Horn of Africa

Saved:
18 articles
5 topics
7 statements
4 charts
3 countries
```

## Nest learning

```text
JWT
guards
decorators
authorization
user relationships
secure token handling
```

## Deliverable

geoP becomes a reusable research workspace.

---

# LEVEL 13 — PRODUCTION QUALITY

## Goal

Turn the application into a strong portfolio-quality engineering project.

## Testing

```text
unit tests
service tests
integration tests
API tests
critical end-to-end flows
```

## Security

```text
input validation
rate limiting
secure headers
CORS
secret management
authentication security
authorization
logging
dependency auditing
```

## Reliability

```text
provider failures
retry policies
timeouts
fallback behavior
API rate exhaustion
stale data handling
health checks
```

## Performance

```text
Redis
database indexes
query optimization
pagination
lazy geographic loading
background ingestion
optimized map geometry
client caching
```

## Documentation

Produce:

```text
README
architecture document
ERD
API documentation
Swagger
data-source documentation
provider documentation
setup instructions
screenshots
demo video
technical case study
```

## DevOps

Potential:

```text
Docker
Docker Compose
GitHub Actions
CI
deployment
environment separation
```

## Deliverable

A deployable and professionally documented geoP project suitable for a portfolio and technical interview discussion.

---

# LEVEL 14 — OPTIONAL FUTURE / STRETCH WORK

These features are **not approved by this document**.

They require future discussion.

Potential directions:

```text
multilingual source comparison
advanced search
local NLP
local/open-source AI
additional free datasets
social discussion analysis
notifications
mobile experience
historical simulation
advanced relationship graphs
```

### Social media

Do not integrate X/Twitter under the current free-only project rule.

Do not add a social platform until a legally usable, genuinely free data interface has been evaluated and explicitly approved.

### AI

Do not add paid LLM APIs.

If AI/NLP is later introduced, evaluate:

```text
local models
open-source models
free computation options
deterministic NLP
```

before adding a dependency.

---

# 21. EXPECTED FINAL geoP INFORMATION STRUCTURE

## WORLD

```text
World

Globe
Current Activity
Regions
Topics
Conflicts
News
Economic Overview
Trade
```

---

## CONTINENT

```text
Africa

Overview
Regions
Countries / Entities
Active Topics
Conflict Activity
News
Economic Overview
Trade
```

---

## REGION

Example:

```text
Horn of Africa

Overview
Entities
Relationships
Active Topics
Conflict Activity
News
Economics
Trade
```

---

## COUNTRY / GEOENTITY

```text
Ethiopia

Overview
Context
History
Geopolitics
Topics
News
Media Coverage
Official Statements
Economy
Trade
Timeline
Sources
```

---

## TOPIC

```text
Nile / GERD

Overview
Interactive Map
Actors
Relationships
History
Timeline
Current Developments
News
Coverage Comparison
Official Statements
Economic Context
Trade Context
Sources
```

---

# 22. UI PRINCIPLES

geoP should feel:

```text
modern
technical
premium
serious
international
data-driven
visual
fast
interactive
```

Avoid:

```text
generic admin dashboard UI
huge grids of unrelated cards
gaming aesthetics
excessive neon
over-animation
template-looking layouts
random gradients
clutter
```

The globe should remain visually central to geoP's identity.

---

# 23. MAP VISUAL LANGUAGE

Eventually establish a consistent language.

Examples only:

```text
Active event       ●
Conflict hotspot   ◉
Connection          ─────
Relationship arc    ╭────╮
Disputed area       patterned overlay
Selected actor      highlighted polygon
Related actor       subtle highlight
```

The final design will be decided during implementation.

Do not implement these simply because they appear here.

---

# 24. BACKEND LEARNING PURPOSE

One of the explicit purposes of geoP is learning and demonstrating **NestJS**.

Therefore do not move important application logic into Next.js just because it is easier.

NestJS should eventually own:

```text
external API integration
data ingestion
data normalization
database access
topic logic
country/entity logic
news logic
trade logic
economic logic
conflict logic
source comparison
background jobs
caching
authentication
authorization
WebSockets
API documentation
```

The frontend should mainly be responsible for:

```text
presentation
interaction
visualization
local UI state
client-side UX
```

---

# 25. WHAT THIS PROJECT SHOULD DEMONSTRATE TECHNICALLY

By completion, geoP should be capable of demonstrating experience with:

```text
NestJS architecture
modular backend design
REST APIs
PostgreSQL
Prisma
complex database relations
external APIs
provider adapters
data normalization
scheduled jobs
queues
Redis
caching
WebSockets
authentication
authorization
Swagger
testing
Docker
CI/CD
geospatial visualization
large interactive frontend
TypeScript full-stack development
```

---

# 26. CURRENT LIKELY DEVELOPMENT ORDER

This is merely our current preference:

```text
LEVEL 1
Foundation + Globe + Nest bootstrap
        ↓

LEVEL 2
Global GeoEntity Registry
        ↓

LEVEL 3
Country / Entity Context
        ↓

LEVEL 4
Geopolitical Topic Engine
        ↓

LEVEL 5
Live News / GDELT
        ↓

LEVEL 6
Conflict Data / UCDP + GDELT Events
        ↓

LEVEL 7
Media Perspective Comparison
        ↓

LEVEL 8
Economy / World Bank
        ↓

LEVEL 9
Trade / UN Comtrade
        ↓

LEVEL 10
Leaders + Official Statements
        ↓

LEVEL 11
Trend + Developing Event Engine
        ↓

LEVEL 12
Accounts + Research Workspace
        ↓

LEVEL 13
Production Quality
        ↓

LEVEL 14
Optional Future Features
```

Again:

**This ordering is NOT binding.**

---

# 27. FIRST IMPLEMENTATION EXPECTATION

When implementation eventually begins, the likely first goal is:

> Build enough of the visual geoP shell and globe to establish the product identity while simultaneously establishing the NestJS backend architecture.

Therefore Level 1 intentionally combines:

```text
UI
+
3D globe
+
NestJS
+
PostgreSQL foundation
```

rather than finishing the entire frontend before starting the backend.

---

# 28. FINAL INSTRUCTION

This document only establishes context.

Do not implement anything.

Do not create a plan beyond what is already written unless requested.

Do not begin Level 1.

Do not modify the repository.

Acknowledge the project context internally and **wait for the next prompt containing the specific work to perform.**
