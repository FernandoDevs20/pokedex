import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import {
  EvolutionChainResponse,
  PokemonDetailResponse,
  PokemonEncounter,
  PokemonListResponse,
  PokemonSpeciesResponse,
} from './pokemon.models';
import { PokemonApiOperation, toPokemonApiError } from './pokemon-api.errors';

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  getPokemonList(limit = 20, offset = 0): Observable<PokemonListResponse> {
    const params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));

    return this.get<PokemonListResponse>('/pokemon', { params }, 'getPokemonList');
  }

  getPokemonDetail(idOrName: string | number): Observable<PokemonDetailResponse> {
    return this.get<PokemonDetailResponse>(
      `/pokemon/${encodeURIComponent(String(idOrName))}`,
      undefined,
      'getPokemonDetail',
    );
  }

  getPokemonEncounters(idOrName: string | number): Observable<PokemonEncounter[]> {
    return this.get<PokemonEncounter[]>(
      `/pokemon/${encodeURIComponent(String(idOrName))}/encounters`,
      undefined,
      'getPokemonEncounters',
    );
  }

  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpeciesResponse> {
    return this.get<PokemonSpeciesResponse>(
      `/pokemon-species/${encodeURIComponent(String(idOrName))}`,
      undefined,
      'getPokemonSpecies',
    );
  }

  getEvolutionChainByUrl(url: string): Observable<EvolutionChainResponse> {
    return this.http.get<EvolutionChainResponse>(url).pipe(
      catchError((error: unknown) =>
        throwError(() => toPokemonApiError('getEvolutionChainByUrl', error)),
      ),
    );
  }

  private get<T>(
    path: string,
    options: { params?: HttpParams } | undefined,
    operation: PokemonApiOperation,
  ): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, options).pipe(
      catchError((error: unknown) => throwError(() => toPokemonApiError(operation, error))),
    );
  }
}
