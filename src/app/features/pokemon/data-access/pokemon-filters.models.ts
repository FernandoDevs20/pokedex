export interface PokemonAdvancedFilters {
  type: string; 
  weakness: string; 
}

export const DEFAULT_POKEMON_FILTERS: PokemonAdvancedFilters = {
  type: '',
  weakness: '',
};
