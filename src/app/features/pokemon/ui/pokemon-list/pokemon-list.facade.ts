import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, finalize, map, of, tap } from 'rxjs';
import {
  DEFAULT_POKEMON_FILTERS,
  PokemonAdvancedFilters,
} from '../../data-access/pokemon-filters.models';
import { PokemonCardModel } from '../../data-access/pokemon.models';
import {
  NormalizedPokemonFilters,
  POKEMON_ERROR_MESSAGES,
  POKEMON_SORT_COMPARATORS,
  POKEMON_SORT_MODES,
  POKEMON_SORT_OPTIONS,
  PokemonSortMode,
  SURPRISE_ICON_PATH,
} from './pokemon-list.constants';
import { PokemonListQueryService } from './pokemon-list.query.service';
import { filterPokemonCards, mergeUniqueById, pickRandomPokemons } from './pokemon-list.utils';

@Injectable()
export class PokemonListFacade {
  private readonly queryService = inject(PokemonListQueryService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pageSize = 16;
  private readonly filterCatalogSize = 150;

  private readonly searchTerm = signal('');
  private readonly filters = signal<PokemonAdvancedFilters>(DEFAULT_POKEMON_FILTERS);

  readonly pokemons = signal<PokemonCardModel[]>([]);
  readonly filterCatalog = signal<PokemonCardModel[]>([]);
  readonly visibleCount = signal(0);
  readonly surpriseCards = signal<PokemonCardModel[] | null>(null);

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly loadingFilterCatalog = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly nextOffset = signal<number | null>(0);
  readonly sortMode = signal<PokemonSortMode>('');
  readonly sortOptions = POKEMON_SORT_OPTIONS;
  readonly surpriseIconPath = SURPRISE_ICON_PATH;

  readonly normalizedSearch = computed(() => this.searchTerm().trim().toLowerCase());
  readonly normalizedFilters = computed<NormalizedPokemonFilters>(() => {
    const filters = this.filters();
    return {
      type: filters.type.trim().toLowerCase(),
      weakness: filters.weakness.trim().toLowerCase(),
    };
  });

  readonly isDiscoveryMode = computed(() => {
    const filters = this.normalizedFilters();
    const hasAdvancedFilters = !!filters.type || !!filters.weakness;
    return this.normalizedSearch().length > 0 || hasAdvancedFilters || this.sortMode() !== '';
  });

  readonly isSurpriseMode = computed(() => this.surpriseCards() !== null);
  readonly isBusy = computed(
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

  private readonly filteredPokemons = computed(() =>
    filterPokemonCards(this.sortedPokemons(), this.normalizedSearch(), this.normalizedFilters()),
  );

  private readonly hasHiddenFilteredCards = computed(
    () => this.displayedPokemons().length < this.filteredPokemons().length,
  );

  private readonly canFetchMoreFromApi = computed(
    () => !this.isDiscoveryMode() && this.nextOffset() !== null,
  );

  readonly displayedPokemons = computed(() => {
    const surpriseCards = this.surpriseCards();
    if (surpriseCards) {
      return surpriseCards;
    }

    return this.filteredPokemons().slice(0, this.visibleCount());
  });

  readonly isEmpty = computed(
    () =>
      !this.loading() && !this.error() && !this.isDiscoveryMode() && this.pokemons().length === 0,
  );

  readonly shouldShowNoResults = computed(
    () =>
      !this.isSurpriseMode() &&
      this.isDiscoveryMode() &&
      !this.loading() &&
      !this.loadingFilterCatalog() &&
      this.filteredPokemons().length === 0,
  );

  readonly noResultsMessage = computed(() => {
    const rawSearchTerm = this.searchTerm().trim();
    if (rawSearchTerm) {
      return `No results for "${rawSearchTerm}".`;
    }

    return 'No Pokemon match the selected filters.';
  });

  readonly shouldShowLoadMoreButton = computed(() => {
    const cardsAvailable = this.filteredPokemons().length;
    return (
      !this.isSurpriseMode() &&
      cardsAvailable > 0 &&
      (this.hasHiddenFilteredCards() || this.canFetchMoreFromApi())
    );
  });

  readonly canLoadMore = computed(
    () => !this.isBusy() && (this.hasHiddenFilteredCards() || this.canFetchMoreFromApi()),
  );

  readonly loadMoreButtonText = computed(() =>
    this.loadingMore() ? 'Loading...' : 'Load more Pokemons',
  );

  readonly isListLoading = computed(() => this.isBusy());

  constructor() {
    this.loadInitialPokemons();

    effect(() => {
      if (this.isDiscoveryMode()) {
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

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setFilters(value: PokemonAdvancedFilters): void {
    this.filters.set(value);
  }

  onSurpriseClick(): void {
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
          this.surpriseCards.set(pickRandomPokemons(cards, this.pageSize));
        },
        error: () => {
          this.error.set(POKEMON_ERROR_MESSAGES.surpriseLoad);
        },
      });
  }

  onLoadMorePokemons(): void {
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

  onSortModeChange(value: string): void {
    if (!this.isPokemonSortMode(value)) {
      return;
    }

    this.sortMode.set(value);
  }

  private loadInitialPokemons(): void {
    this.loading.set(true);
    this.error.set(null);
    this.resetPokemonListState();

    this.queryService
      .getPokemonCardsPage(this.pageSize, 0)
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

    this.queryService
      .getPokemonCardsPage(this.pageSize, offset)
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
            const mergedCards = mergeUniqueById(currentCards, cards);
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

    this.queryService
      .getPokemonCardsPage(this.filterCatalogSize, 0)
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

    return this.queryService.getPokemonCardsPage(this.filterCatalogSize, 0).pipe(
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
}
