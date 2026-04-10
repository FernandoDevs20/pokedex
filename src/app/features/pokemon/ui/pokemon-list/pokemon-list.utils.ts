import { PokemonCardModel, PokemonDetailResponse } from '../../data-access/pokemon.models';
import { TYPE_WEAKNESS_MAP } from '../../domain/pokemon-type.constants';
import { NormalizedPokemonFilters } from './pokemon-list.constants';

export function extractOffsetFromNextUrl(nextUrl: string | null): number | null {
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

export function mergeUniqueById(
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

export function pickRandomPokemons(sourceCards: PokemonCardModel[], amount: number): PokemonCardModel[] {
  const shuffledCards = [...sourceCards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentCard = shuffledCards[index];
    shuffledCards[index] = shuffledCards[randomIndex];
    shuffledCards[randomIndex] = currentCard;
  }

  return shuffledCards.slice(0, Math.min(amount, shuffledCards.length));
}

export function toPokemonCardModel(pokemonDetailResponse: PokemonDetailResponse): PokemonCardModel {
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

export function filterPokemonCards(
  cards: PokemonCardModel[],
  normalizedTerm: string,
  normalizedFilters: NormalizedPokemonFilters,
): PokemonCardModel[] {
  if (!normalizedTerm && !normalizedFilters.type && !normalizedFilters.weakness) {
    return cards;
  }

  const numericId = parsePokemonId(normalizedTerm);

  return cards.filter((pokemon) => {
    const matchesSearch =
      !normalizedTerm ||
      (numericId !== null
        ? pokemon.id === numericId
        : pokemon.name.toLowerCase().includes(normalizedTerm));

    if (!matchesSearch) {
      return false;
    }

    return matchesAdvancedFilters(pokemon, normalizedFilters);
  });
}

function parsePokemonId(term: string): number | null {
  const numericText = term.replace(/[^0-9]/g, '');
  if (!numericText) {
    return null;
  }

  const value = Number.parseInt(numericText, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function matchesAdvancedFilters(
  pokemon: PokemonCardModel,
  normalizedFilters: NormalizedPokemonFilters,
): boolean {
  const { type, weakness } = normalizedFilters;
  const matchesType = !type || pokemon.types.some((pokemonType) => pokemonType.toLowerCase() === type);

  if (!matchesType) {
    return false;
  }

  if (!weakness) {
    return true;
  }

  return getWeaknesses(pokemon.types).has(weakness);
}

function getWeaknesses(types: string[]): Set<string> {
  const weaknesses = new Set<string>();

  for (const pokemonType of types) {
    const typeWeaknesses = TYPE_WEAKNESS_MAP[pokemonType.toLowerCase()] ?? [];
    for (const weakness of typeWeaknesses) {
      weaknesses.add(weakness);
    }
  }

  return weaknesses;
}
