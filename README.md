# Pokedex

![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?logo=reactivex&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![Prettier](https://img.shields.io/badge/Code%20Style-Prettier-F7B93E?logo=prettier&logoColor=1A2B34)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?logo=githubpages&logoColor=white)

## URL
https://fernandodevs20.github.io/pokedex/

## Features
- Browse Pokemon list with load-more pagination
- Search Pokemon by name or ID
- Filter Pokemon by type and weakness
- Sort by ID and name (ascending/descending)
- Detail view with stats, abilities, description, and evolutions
- Pokemon cry playback in detail view
- Responsive UI across mobile and desktop

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm (project uses `npm`)
- Angular CLI (`ng`) available globally or via `npx`
- Local development is run with Angular CLI (`ng serve` / `npm start`).

### Install
```bash
npm install
```

### Run in development
```bash
npm start
```
App runs at `http://localhost:4200/`.

Alternative command:
```bash
ng serve
```

### Build
```bash
npm run build
```
## Project Structure
```text
src/
├── index.html
├── main.ts
├── main.server.ts
├── server.ts
├── styles.css
├── app/
│   ├── app.ts
│   ├── app.html
│   ├── app.css
│   ├── app.config.ts
│   ├── app.config.server.ts
│   ├── app.routes.ts
│   ├── app.routes.server.ts
│   ├── app.spec.ts
│   ├── features/
│   │   └── pokemon/
│   │       ├── data-access/
│   │       │   ├── pokemon-api.errors.ts
│   │       │   ├── pokemon-api.service.ts
│   │       │   ├── pokemon-cry.service.ts
│   │       │   ├── pokemon-filters.models.ts
│   │       │   └── pokemon.models.ts
│   │       ├── domain/
│   │       │   └── pokemon-type.constants.ts
│   │       ├── pages/
│   │       │   ├── pokemon-home/         # page component (ts/html/css)
│   │       │   └── pokemon-detail/       # page component (ts/html/css/spec)
│   │       └── ui/
│   │           ├── header/               # ui component (ts/html/css/spec)
│   │           ├── advance-search-bar/   # ui component (ts/html/css/spec)
│   │           ├── pokemon-card/         # ui component (ts/html/css/spec)
│   │           ├── pokemon-stats/        # ui component (ts/html/css)
│   │           ├── pokemon-evolutions/   # ui component (ts/html/css)
│   │           └── pokemon-list/
│   │               ├── pokemon-list.ts
│   │               ├── pokemon-list.html
│   │               ├── pokemon-list.css
│   │               ├── pokemon-list.spec.ts
│   │               ├── pokemon-list.constants.ts
│   │               ├── pokemon-list.facade.ts
│   │               ├── pokemon-list.query.service.ts
│   │               └── pokemon-list.utils.ts
│   └── shared/
│       └── ui/
│           ├── common-button/
│           ├── home-fab/
│           ├── loader-overlay/
│           ├── pokeball-icon/
│           ├── pokemon-type-tag/
│           ├── scroll-top-fab/
│           └── sort-select/
```

## Tech decisions
- **Angular 21 (standalone components + signals):** I chose it as the main framework to practice, in a real project, to strengthen my frontend skills in a component-based framework with reactive state management.
- **RxJS:** I used it to better learn asynchronous data flow handling (API requests, transformations, and data composition).
- **Angular Router:** I used it to practice clear and maintainable view navigation (`home` and `detail` routes).
- **HttpClient:** I chose it for typed API consumption aligned with Angular official best practices.
- **TypeScript (strict mode):** I kept strict typing enabled to improve code quality and reduce development-time errors.
- **Prettier:** I configured it to keep a consistent code style and make code reviews easier.

## AI usage disclosure

AI tools were used during development, mainly **ChatGPT** and **Codex**.
I also maintained an `AGENTS.md` file with Angular-focused instructions/prompts to enforce modern best practices (standalone components, signals, clean architecture, typed code, and accessibility-oriented decisions).
The base prompt in `AGENTS.md` was copied verbatim from the official Angular documentation and reused as project guidance.
Even when using that prompt, all generated code was reviewed, adjusted, and validated by me.

### How AI was used in practice
- Used as a **technical consultant** for key decisions, especially:
  - how to structure API consumption (`PokemonApiService` + data-access boundaries),
  - how to organize/refactor large components (`pokemon-list` split into component/facade/helpers),
  - how to keep changes incremental and maintainable.
- Used in **planner mode** to break work into controlled steps before applying code changes.
- Used alongside the **official Angular documentation** to validate recommendations and reduce incorrect assumptions.
- Used as a learning aid for concepts new to me (for example: `pipe`, `subscribe`, RxJS flow composition, and some CSS topics like animations/keyframes).

### AI-assisted code areas
- **Pokemon list flow (`pokemon-list`)**: component organization, filtering/search flow, and incremental refactors for readability.
- **Pokemon detail flow (`pokemon-detail`)**: API data orchestration for detail rendering and evolutions-related logic updates.
- **Pokemon stats UI (`pokemon-stats`)**: support for data mapping/presentation refinements.
- **Data-access layer (`PokemonApiService`)**: endpoint call patterns, typed responses, and service-level architecture decisions.
- **Error handling and cache strategy**: consistent API error mapping, in-memory TTL cache, and request deduplication improvements.
- **Refactoring support across modules**: extracting responsibilities, reducing component complexity, and keeping changes incremental.

### Ownership and understanding
- I did not accept generated code blindly; each change was manually reviewed and adjusted to project constraints.
- I can explain the resulting logic (API calls, RxJS operators, cache behavior, component/facade responsibilities).
- Refactors and implementation decisions were cross-checked against Angular official docs and then validated in the project.
- AI was also used as a learning tool to better understand Angular patterns and the reasoning behind the final implementation.
- Final responsibility for architecture, integration, and correctness is mine.
