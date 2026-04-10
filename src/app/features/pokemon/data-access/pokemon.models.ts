export interface NamedApiResource {
  name: string;
  url: string;
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonAbilitySlot {
  slot: number;
  is_hidden: boolean;
  ability: NamedApiResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedApiResource;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    ['official-artwork']?: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface PokemonDetailResponse {
  id: number;
  name: string;
  base_experience: number | null;
  cries?: {
    latest: string | null;
    legacy: string | null;
  };
  height: number;
  is_default: boolean;
  order: number;
  weight: number;
  abilities: PokemonAbilitySlot[];
  sprites: PokemonSprites;
  species: NamedApiResource;
  stats: PokemonStat[];
  types: PokemonTypeSlot[];
  location_area_encounters: string;
}

export interface PokemonEncounter {
  location_area: NamedApiResource;
  version_details: Array<{
    max_chance: number;
    encounter_details: Array<{
      chance: number;
      min_level: number;
      max_level: number;
      method: NamedApiResource;
      condition_values: NamedApiResource[];
    }>;
    version: NamedApiResource;
  }>;
}

export interface PokemonCardModel {
  id: number;
  name: string;
  imageUrl: string | null;
  types: string[];
  cryUrl?: string | null;
}

export interface PokemonSpeciesResponse {
  id: number;
  name: string;
  gender_rate: number;
  evolution_chain: {
    url: string;
  };
  genera: Array<{
    genus: string;
    language: NamedApiResource;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedApiResource;
    version: NamedApiResource;
  }>;
}

export interface EvolutionChainLink {
  species: NamedApiResource;
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: EvolutionChainLink;
}
