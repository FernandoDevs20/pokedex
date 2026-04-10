import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { CommonButton } from '../../../../shared/ui/common-button/common-button';
import { LoaderOverlay } from '../../../../shared/ui/loader-overlay/loader-overlay';
import { SortSelect } from '../../../../shared/ui/sort-select/sort-select';
import {
  DEFAULT_POKEMON_FILTERS,
  PokemonAdvancedFilters,
} from '../../data-access/pokemon-filters.models';
import { PokemonCardModel } from '../../data-access/pokemon.models';
import { PokemonCard } from '../pokemon-card/pokemon-card';
import { PokemonListFacade } from './pokemon-list.facade';

@Component({
  selector: 'app-pokemon-list',
  imports: [CommonButton, PokemonCard, LoaderOverlay, SortSelect],
  providers: [PokemonListFacade],
  templateUrl: './pokemon-list.html',
  styleUrl: './pokemon-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonList {
  private readonly facade = inject(PokemonListFacade);

  readonly searchTerm = input<string>('');
  readonly filters = input<PokemonAdvancedFilters>(DEFAULT_POKEMON_FILTERS);

  protected readonly pokemons = this.facade.pokemons;
  protected readonly error = this.facade.error;
  protected readonly sortMode = this.facade.sortMode;
  protected readonly sortOptions = this.facade.sortOptions;
  protected readonly displayedPokemons = this.facade.displayedPokemons;
  protected readonly isEmpty = this.facade.isEmpty;
  protected readonly shouldShowNoResults = this.facade.shouldShowNoResults;
  protected readonly noResultsMessage = this.facade.noResultsMessage;
  protected readonly shouldShowLoadMoreButton = this.facade.shouldShowLoadMoreButton;
  protected readonly canLoadMore = this.facade.canLoadMore;
  protected readonly loadMoreButtonText = this.facade.loadMoreButtonText;
  protected readonly isListLoading = this.facade.isListLoading;
  protected readonly surpriseIconPath = this.facade.surpriseIconPath;

  constructor() {
    effect(() => {
      this.facade.setSearchTerm(this.searchTerm());
      this.facade.setFilters(this.filters());
    });
  }

  protected onSurpriseClick(): void {
    this.facade.onSurpriseClick();
  }

  protected trackPokemonById(_index: number, pokemon: PokemonCardModel): number {
    return pokemon.id;
  }

  protected onLoadMorePokemons(): void {
    this.facade.onLoadMorePokemons();
  }

  protected onSortModeChange(value: string): void {
    this.facade.onSortModeChange(value);
  }
}
