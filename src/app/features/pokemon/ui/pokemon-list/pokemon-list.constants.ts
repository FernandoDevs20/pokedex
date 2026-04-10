import { SortSelectOption } from '../../../../shared/ui/sort-select/sort-select';
import { PokemonCardModel } from '../../data-access/pokemon.models';

export type PokemonSortMode = '' | 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc';
type PokemonSortComparatorMode = Exclude<PokemonSortMode, ''>;

export type NormalizedPokemonFilters = Readonly<{ type: string; weakness: string }>;

export const POKEMON_SORT_OPTIONS: ReadonlyArray<SortSelectOption> = [
  { value: '', label: 'Sort results' },
  { value: 'id-asc', label: 'Lowest Number (First)' },
  { value: 'id-desc', label: 'Highest Number (First)' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
];

export const POKEMON_SORT_MODES = new Set<PokemonSortMode>([
  '',
  'id-asc',
  'id-desc',
  'name-asc',
  'name-desc',
]);

export const POKEMON_ERROR_MESSAGES = {
  initialLoad: 'No se pudieron cargar los Pokemons. Intenta nuevamente.',
  loadMore: 'No se pudieron cargar más Pokemons. Intenta nuevamente.',
  filterCatalog: 'No se pudo cargar el catálogo de filtros (primeros 150).',
  surpriseEmpty: 'No se encontraron Pokemons para Surprise Me.',
  surpriseLoad: 'No se pudieron obtener Pokemons aleatorios. Intenta nuevamente.',
} as const;

export const POKEMON_SORT_COMPARATORS = {
  'id-asc': (a: PokemonCardModel, b: PokemonCardModel) => a.id - b.id,
  'id-desc': (a: PokemonCardModel, b: PokemonCardModel) => b.id - a.id,
  'name-asc': (a: PokemonCardModel, b: PokemonCardModel) => a.name.localeCompare(b.name),
  'name-desc': (a: PokemonCardModel, b: PokemonCardModel) => b.name.localeCompare(a.name),
} as const satisfies Record<
  PokemonSortComparatorMode,
  (a: PokemonCardModel, b: PokemonCardModel) => number
>;

export const SURPRISE_ICON_PATH =
  'M12 6V3L8 7l4 4V8c2.21 0 4 1.79 4 4 0 .7-.18 1.37-.5 1.95l1.46 1.46A5.96 5.96 0 0 0 18 12c0-3.31-2.69-6-6-6Zm-4.5 4.05L6.04 8.59A5.96 5.96 0 0 0 6 12c0 3.31 2.69 6 6 6v3l4-4-4-4v3c-2.21 0-4-1.79-4-4 0-.7.18-1.37.5-1.95Z';
