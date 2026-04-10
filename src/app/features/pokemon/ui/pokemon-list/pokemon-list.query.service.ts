import { Injectable, inject } from '@angular/core';
import { from, map, mergeMap, Observable, switchMap, toArray } from 'rxjs';
import { PokemonApiService } from '../../data-access/pokemon-api.service';
import { PokemonCardModel } from '../../data-access/pokemon.models';
import { extractOffsetFromNextUrl, toPokemonCardModel } from './pokemon-list.utils';

export type PokemonCardsPage = {
  count: number;
  cards: PokemonCardModel[];
  nextOffset: number | null;
};

@Injectable({ providedIn: 'root' })
export class PokemonListQueryService {
  private readonly pokemonApiService = inject(PokemonApiService);

  getPokemonCardsPage(limit: number, offset: number): Observable<PokemonCardsPage> {
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
              .map(({ pokemonDetailResponse }) => toPokemonCardModel(pokemonDetailResponse)),
          ),
          map((cards) => ({
            count: pokemonListResponse.count,
            cards,
            nextOffset: extractOffsetFromNextUrl(pokemonListResponse.next),
          })),
        ),
      ),
    );
  }
}
