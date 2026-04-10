import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { finalize, from, map, mergeMap, Observable, of, switchMap, tap, toArray } from 'rxjs';
import { CommonButton } from '../../../../shared/ui/common-button/common-button';
import { LoaderOverlay } from '../../../../shared/ui/loader-overlay/loader-overlay';
import { SortSelect, SortSelectOption } from '../../../../shared/ui/sort-select/sort-select';
import { PokemonApiService } from '../../data-access/pokemon-api.service';
import { PokemonCard } from '../pokemon-card/pokemon-card';
import { PokemonCardModel, PokemonDetailResponse } from '../../data-access/pokemon.models';
import {
  DEFAULT_POKEMON_FILTERS,
  PokemonAdvancedFilters,
} from '../../data-access/pokemon-filters.models';
import { TYPE_WEAKNESS_MAP } from '../../domain/pokemon-type.constants';

type PokemonSortMode = '' | 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc';
type PokemonSortComparatorMode = Exclude<PokemonSortMode, ''>;
type NormalizedPokemonFilters = Readonly<{ type: string; weakness: string }>;

type PokemonCardsPage = {
  count: number;
  cards: PokemonCardModel[];
  nextOffset: number | null;
};

const POKEMON_SORT_OPTIONS: ReadonlyArray<SortSelectOption> = [
  { value: '', label: 'Sort results' },
  { value: 'id-asc', label: 'ID (asc)' },
  { value: 'id-desc', label: 'ID (desc)' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
];

const POKEMON_SORT_MODES = new Set<PokemonSortMode>([
  '',
  'id-asc',
  'id-desc',
  'name-asc',
  'name-desc',
]);

const POKEMON_ERROR_MESSAGES = {
  initialLoad: 'No se pudieron cargar los Pokemons. Intenta nuevamente.',
  loadMore: 'No se pudieron cargar más Pokemons. Intenta nuevamente.',
  filterCatalog: 'No se pudo cargar el catálogo de filtros (primeros 150).',
  surpriseEmpty: 'No se encontraron Pokemons para Surprise Me.',
  surpriseLoad: 'No se pudieron obtener Pokemons aleatorios. Intenta nuevamente.',
} as const;

const POKEMON_SORT_COMPARATORS = {
  'id-asc': (a: PokemonCardModel, b: PokemonCardModel) => a.id - b.id,
  'id-desc': (a: PokemonCardModel, b: PokemonCardModel) => b.id - a.id,
  'name-asc': (a: PokemonCardModel, b: PokemonCardModel) => a.name.localeCompare(b.name),
  'name-desc': (a: PokemonCardModel, b: PokemonCardModel) => b.name.localeCompare(a.name),
} as const satisfies Record<
  PokemonSortComparatorMode,
  (a: PokemonCardModel, b: PokemonCardModel) => number
>;

const SURPRISE_ICON_PATH =
  'M12 6V3L8 7l4 4V8c2.21 0 4 1.79 4 4 0 .7-.18 1.37-.5 1.95l1.46 1.46A5.96 5.96 0 0 0 18 12c0-3.31-2.69-6-6-6Zm-4.5 4.05L6.04 8.59A5.96 5.96 0 0 0 6 12c0 3.31 2.69 6 6 6v3l4-4-4-4v3c-2.21 0-4-1.79-4-4 0-.7.18-1.37.5-1.95Z';

@Component({
  selector: 'app-pokemon-list',
  imports: [CommonButton, PokemonCard, LoaderOverlay, SortSelect],
  templateUrl: './pokemon-list.html',
  styleUrl: './pokemon-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonList {
  private readonly pokemonApiService = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pageSize = 16;
  private readonly filterCatalogSize = 150;

  readonly searchTerm = input<string>('');
  readonly filters = input<PokemonAdvancedFilters>(DEFAULT_POKEMON_FILTERS);

  protected readonly pokemons = signal<PokemonCardModel[]>([]);
  protected readonly filterCatalog = signal<PokemonCardModel[]>([]);
  protected readonly visibleCount = signal(0);
  protected readonly surpriseCards = signal<PokemonCardModel[] | null>(null);

  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly loadingFilterCatalog = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totalCount = signal(0);
  protected readonly nextOffset = signal<number | null>(0);
  protected readonly sortMode = signal<PokemonSortMode>('');

  protected readonly sortOptions = POKEMON_SORT_OPTIONS;

  protected readonly normalizedSearch = computed(() => this.searchTerm().trim().toLowerCase());
  protected readonly normalizedFilters = computed<NormalizedPokemonFilters>(() => {
    const filters = this.filters();
    return {
      type: filters.type.trim().toLowerCase(),
      weakness: filters.weakness.trim().toLowerCase(),
    };
  });

  protected readonly isDiscoveryMode = computed(() => {
    const filters = this.normalizedFilters();
    const hasAdvancedFilters = !!filters.type || !!filters.weakness;
    return this.normalizedSearch().length > 0 || hasAdvancedFilters || this.sortMode() !== '';
  });

  protected readonly isSurpriseMode = computed(() => this.surpriseCards() !== null);
  protected readonly isBusy = computed(
    () => this.loading() || this.loadingMore() || this.loadingFilterCatalog(),
  );

  private readonly sourceCards = computed(() => {
    if (!this.isDiscoveryMode()) {
      return this.pokemons();
    }

    const cachedCatalog = this.filterCatalog();
    if (cachedCatalog.length > 0) {
      return cachedCatalog;
    }

    return this.pokemons();
  });

  private readonly sortedPokemons = computed(() => {
    const mode = this.sortMode();
    if (!mode) {
      return this.sourceCards();
    }

    return [...this.sourceCards()].sort(POKEMON_SORT_COMPARATORS[mode]);
  });

  private readonly filteredPokemons = computed(() => {
    const cards = this.sortedPokemons();
    const term = this.normalizedSearch();
    const filters = this.normalizedFilters();
    return this.filterPokemonCards(cards, term, filters);
  });

  private readonly hasHiddenFilteredCards = computed(
    () => this.displayedPokemons().length < this.filteredPokemons().length,
  );

  private readonly canFetchMoreFromApi = computed(
    () => !this.isDiscoveryMode() && this.nextOffset() !== null,
  );

  protected readonly displayedPokemons = computed(() => {
    const surpriseCards = this.surpriseCards();
    if (surpriseCards) {
      return surpriseCards;
    }

    return this.filteredPokemons().slice(0, this.visibleCount());
  });

  protected readonly isEmpty = computed(
    () =>
      !this.loading() && !this.error() && !this.isDiscoveryMode() && this.pokemons().length === 0,
  );

  protected readonly shouldShowNoResults = computed(() => {
    return (
      !this.isSurpriseMode() &&
      this.isDiscoveryMode() &&
      !this.loading() &&
      !this.loadingFilterCatalog() &&
      this.filteredPokemons().length === 0
    );
  });

  protected readonly noResultsMessage = computed(() => {
    const rawSearchTerm = this.searchTerm().trim();
    if (rawSearchTerm) {
      return `No results for "${rawSearchTerm}".`;
    }

    return 'No Pokemon match the selected filters.';
  });

  protected readonly shouldShowLoadMoreButton = computed(() => {
    const cardsAvailable = this.filteredPokemons().length;
    return (
      !this.isSurpriseMode() &&
      cardsAvailable > 0 &&
      (this.hasHiddenFilteredCards() || this.canFetchMoreFromApi())
    );
  });

  protected readonly canLoadMore = computed(() => {
    return !this.isBusy() && (this.hasHiddenFilteredCards() || this.canFetchMoreFromApi());
  });

  protected readonly loadMoreButtonText = computed(() => {
    if (this.loadingMore()) {
      return 'Loading...';
    }

    return 'Load more Pokemons';
  });

  protected readonly isListLoading = computed(() => this.isBusy());

  protected readonly surpriseIconPath = SURPRISE_ICON_PATH;

  constructor() {
    this.loadInitialPokemons();

    effect(() => {
      const discoveryActive = this.isDiscoveryMode();
      if (discoveryActive) {
        this.ensureFilterCatalogLoaded();
      }

      this.visibleCount.set(this.pageSize);
    });

    effect(() => {
      this.normalizedSearch();
      this.normalizedFilters();
      this.sortMode();
      this.surpriseCards.set(null);
    });
  }

  protected onSurpriseClick(): void {
    if (this.isBusy()) {
      return;
    }

    this.loadingMore.set(true);
    this.error.set(null);
    this.surpriseCards.set(null);

    this.getFirst150Catalog()
      .pipe(
        finalize(() => this.loadingMore.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (cards) => {
          if (cards.length === 0) {
            this.error.set(POKEMON_ERROR_MESSAGES.surpriseEmpty);
            return;
          }

          this.sortMode.set('');
          this.surpriseCards.set(this.pickRandomPokemons(cards, this.pageSize));
        },
        error: () => {
          this.error.set(POKEMON_ERROR_MESSAGES.surpriseLoad);
        },
      });
  }

  protected trackPokemonById(_index: number, pokemon: PokemonCardModel): number {
    return pokemon.id;
  }

  protected onLoadMorePokemons(): void {
    if (!this.canLoadMore()) {
      return;
    }

    if (this.hasHiddenFilteredCards()) {
      const cardsAvailable = this.filteredPokemons().length;
      this.visibleCount.update((currentCount) =>
        Math.min(currentCount + this.pageSize, cardsAvailable),
      );
      return;
    }

    const offset = this.nextOffset();
    if (offset === null) {
      return;
    }

    this.loadNextPage(offset);
  }

  protected onSortModeChange(value: string): void {
    if (!this.isPokemonSortMode(value)) {
      return;
    }

    this.sortMode.set(value);
  }

  private loadInitialPokemons(): void {
    this.loading.set(true);
    this.error.set(null);
    this.resetPokemonListState();

    this.getPokemonCardsPage(this.pageSize, 0)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ count, cards, nextOffset }) => {
          this.totalCount.set(count);
          this.pokemons.set(cards);
          this.nextOffset.set(nextOffset);
          this.visibleCount.set(Math.min(this.pageSize, cards.length));
        },
        error: () => {
          this.error.set(POKEMON_ERROR_MESSAGES.initialLoad);
          this.pokemons.set([]);
          this.nextOffset.set(null);
          this.visibleCount.set(0);
        },
      });
  }

  private loadNextPage(offset: number): void {
    this.loadingMore.set(true);

    this.getPokemonCardsPage(this.pageSize, offset)
      .pipe(
        finalize(() => this.loadingMore.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ count, cards, nextOffset }) => {
          this.totalCount.set(count);
          this.nextOffset.set(nextOffset);
          let appendedCount = 0;
          this.pokemons.update((currentCards) => {
            const mergedCards = this.mergeUniqueById(currentCards, cards);
            appendedCount = mergedCards.length - currentCards.length;
            return mergedCards;
          });
          this.visibleCount.update((currentCount) => currentCount + appendedCount);
        },
        error: () => {
          this.error.set(POKEMON_ERROR_MESSAGES.loadMore);
        },
      });
  }

  private ensureFilterCatalogLoaded(): void {
    if (this.loadingFilterCatalog() || this.filterCatalog().length > 0) {
      return;
    }

    this.loadingFilterCatalog.set(true);

    this.getPokemonCardsPage(this.filterCatalogSize, 0)
      .pipe(
        finalize(() => this.loadingFilterCatalog.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ cards }) => {
          this.filterCatalog.set(cards);
        },
        error: () => {
          this.error.set(POKEMON_ERROR_MESSAGES.filterCatalog);
        },
      });
  }

  private getFirst150Catalog(): Observable<PokemonCardModel[]> {
    const cached = this.filterCatalog();
    if (cached.length >= this.filterCatalogSize) {
      return of(cached);
    }

    return this.getPokemonCardsPage(this.filterCatalogSize, 0).pipe(
      map(({ cards }) => cards),
      tap((cards) => this.filterCatalog.set(cards)),
    );
  }

  private isPokemonSortMode(value: string): value is PokemonSortMode {
    return POKEMON_SORT_MODES.has(value as PokemonSortMode);
  }

  private resetPokemonListState(): void {
    this.pokemons.set([]);
    this.totalCount.set(0);
    this.nextOffset.set(0);
    this.visibleCount.set(0);
  }

  private getPokemonCardsPage(limit: number, offset: number): Observable<PokemonCardsPage> {
    return this.pokemonApiService.getPokemonList(limit, offset).pipe(
      switchMap((pokemonListResponse) =>
        from(pokemonListResponse.results).pipe(
          map((pokemonListItem, index) => ({ pokemonListItem, index })),
          mergeMap(
            ({ pokemonListItem, index }) =>
              this.pokemonApiService
                .getPokemonDetail(pokemonListItem.name)
                .pipe(map((pokemonDetailResponse) => ({ pokemonDetailResponse, index }))),
            10,
          ),
          toArray(),
          map((pokemonEntries) =>
            pokemonEntries
              .sort((a, b) => a.index - b.index)
              .map(({ pokemonDetailResponse }) => this.toPokemonCardModel(pokemonDetailResponse)),
          ),
          map((cards) => ({
            count: pokemonListResponse.count,
            cards,
            nextOffset: this.extractOffsetFromNextUrl(pokemonListResponse.next),
          })),
        ),
      ),
    );
  }

  private extractOffsetFromNextUrl(nextUrl: string | null): number | null {
    if (!nextUrl) {
      return null;
    }

    try {
      const parsedUrl = new URL(nextUrl);
      const offset = parsedUrl.searchParams.get('offset');
      if (!offset) {
        return null;
      }

      const parsedOffset = Number.parseInt(offset, 10);
      return Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : null;
    } catch {
      return null;
    }
  }

  private mergeUniqueById(
    currentCards: PokemonCardModel[],
    incomingCards: PokemonCardModel[],
  ): PokemonCardModel[] {
    if (incomingCards.length === 0) {
      return currentCards;
    }

    const seenIds = new Set(currentCards.map((pokemon) => pokemon.id));
    const uniqueIncomingCards = incomingCards.filter((pokemon) => !seenIds.has(pokemon.id));
    return [...currentCards, ...uniqueIncomingCards];
  }

  private pickRandomPokemons(sourceCards: PokemonCardModel[], amount: number): PokemonCardModel[] {
    const shuffledCards = [...sourceCards];

    for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const currentCard = shuffledCards[index];
      shuffledCards[index] = shuffledCards[randomIndex];
      shuffledCards[randomIndex] = currentCard;
    }

    return shuffledCards.slice(0, Math.min(amount, shuffledCards.length));
  }

  private toPokemonCardModel(pokemonDetailResponse: PokemonDetailResponse): PokemonCardModel {
    return {
      id: pokemonDetailResponse.id,
      name: pokemonDetailResponse.name,
      imageUrl:
        pokemonDetailResponse.sprites.other?.['official-artwork']?.front_default ??
        pokemonDetailResponse.sprites.front_default,
      types: pokemonDetailResponse.types.map((pokemonTypeSlot) => pokemonTypeSlot.type.name),
      cryUrl: pokemonDetailResponse.cries?.latest ?? pokemonDetailResponse.cries?.legacy ?? null,
    };
  }

  private filterPokemonCards(
    cards: PokemonCardModel[],
    normalizedTerm: string,
    normalizedFilters: NormalizedPokemonFilters,
  ): PokemonCardModel[] {
    if (!normalizedTerm && !normalizedFilters.type && !normalizedFilters.weakness) {
      return cards;
    }

    const numericId = this.parsePokemonId(normalizedTerm);

    return cards.filter((pokemon) => {
      const matchesSearch =
        !normalizedTerm ||
        (numericId !== null
          ? pokemon.id === numericId
          : pokemon.name.toLowerCase().includes(normalizedTerm));

      if (!matchesSearch) {
        return false;
      }

      return this.matchesAdvancedFilters(pokemon, normalizedFilters);
    });
  }

  private parsePokemonId(term: string): number | null {
    const numericText = term.replace(/[^0-9]/g, '');
    if (!numericText) {
      return null;
    }

    const value = Number.parseInt(numericText, 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private matchesAdvancedFilters(
    pokemon: PokemonCardModel,
    normalizedFilters: NormalizedPokemonFilters,
  ): boolean {
    const { type, weakness } = normalizedFilters;

    const matchesType =
      !type || pokemon.types.some((pokemonType) => pokemonType.toLowerCase() === type);
    if (!matchesType) {
      return false;
    }

    if (!weakness) {
      return true;
    }

    return this.getWeaknesses(pokemon.types).has(weakness);
  }

  private getWeaknesses(types: string[]): Set<string> {
    const weaknesses = new Set<string>();

    for (const pokemonType of types) {
      const typeWeaknesses = TYPE_WEAKNESS_MAP[pokemonType.toLowerCase()] ?? [];
      for (const weakness of typeWeaknesses) {
        weaknesses.add(weakness);
      }
    }

    return weaknesses;
  }
}
