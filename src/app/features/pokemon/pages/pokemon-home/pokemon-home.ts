import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AdvanceSearchBar } from '../../ui/advance-search-bar/advance-search-bar';
import { Header } from '../../ui/header/header';
import { PokemonList } from '../../ui/pokemon-list/pokemon-list';
import { ScrollTopFab } from '../../../../shared/ui/scroll-top-fab/scroll-top-fab';
import { DEFAULT_POKEMON_FILTERS, PokemonAdvancedFilters } from '../../data-access/pokemon-filters.models';

@Component({
  selector: 'app-pokemon-home',
  imports: [Header, AdvanceSearchBar, PokemonList, ScrollTopFab],
  templateUrl: './pokemon-home.html',
  styleUrl: './pokemon-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonHome {
  protected readonly searchTerm = signal('');
  protected readonly filters = signal<PokemonAdvancedFilters>(DEFAULT_POKEMON_FILTERS);

  protected onSearchSubmitted(term: string): void {
    this.searchTerm.set(term);
  }

  protected onFiltersChange(filters: PokemonAdvancedFilters): void {
    this.filters.set(filters);
  }
}
