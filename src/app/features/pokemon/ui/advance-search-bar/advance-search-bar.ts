import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
} from '@angular/core';
import { SortSelect, SortSelectOption } from '../../../../shared/ui/sort-select/sort-select';
import {
  DEFAULT_POKEMON_FILTERS,
  PokemonAdvancedFilters,
} from '../../data-access/pokemon-filters.models';

@Component({
  selector: 'app-advance-search-bar',
  imports: [SortSelect],
  templateUrl: './advance-search-bar.html',
  styleUrl: './advance-search-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvanceSearchBar {
  protected readonly isAdvancedSearchVisible = signal(false);

  readonly filtersChange = output<PokemonAdvancedFilters>();

  protected readonly selectedType = signal(DEFAULT_POKEMON_FILTERS.type);
  protected readonly selectedWeakness = signal(DEFAULT_POKEMON_FILTERS.weakness);

  protected readonly typeOptions: ReadonlyArray<SortSelectOption> = [
    { value: '', label: 'Type' },
    { value: 'normal', label: 'Normal' },
    { value: 'fire', label: 'Fire' },
    { value: 'water', label: 'Water' },
    { value: 'electric', label: 'Electric' },
    { value: 'grass', label: 'Grass' },
    { value: 'ice', label: 'Ice' },
    { value: 'fighting', label: 'Fighting' },
    { value: 'poison', label: 'Poison' },
    { value: 'ground', label: 'Ground' },
    { value: 'flying', label: 'Flying' },
    { value: 'psychic', label: 'Psychic' },
    { value: 'bug', label: 'Bug' },
    { value: 'rock', label: 'Rock' },
    { value: 'ghost', label: 'Ghost' },
    { value: 'dragon', label: 'Dragon' },
    { value: 'dark', label: 'Dark' },
    { value: 'steel', label: 'Steel' },
    { value: 'fairy', label: 'Fairy' },
  ];

  protected readonly weaknessOptions: ReadonlyArray<SortSelectOption> = [
    { value: '', label: 'Weakness' },
    ...this.typeOptions.slice(1),
  ];

  protected toggleAdvancedSearch(): void {
    this.isAdvancedSearchVisible.update((currentValue) => !currentValue);
  }

  protected onTypeChange(value: string): void {
    this.selectedType.set(value);
    this.emitFilters();
  }

  protected onWeaknessChange(value: string): void {
    this.selectedWeakness.set(value);
    this.emitFilters();
  }

  protected onClearFilters(): void {
    this.selectedType.set(DEFAULT_POKEMON_FILTERS.type);
    this.selectedWeakness.set(DEFAULT_POKEMON_FILTERS.weakness);
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      type: this.selectedType(),
      weakness: this.selectedWeakness(),
    });
  }
}
