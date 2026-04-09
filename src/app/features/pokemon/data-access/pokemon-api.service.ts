import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EvolutionChainResponse,
  PokemonDetailResponse,
  PokemonEncounter,
  PokemonListResponse,
  PokemonSpeciesResponse,
} from './pokemon.models';

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  getPokemonList(limit = 20, offset = 0): Observable<PokemonListResponse> {
    const params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset));

    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon`, { params });
  }

  getPokemonDetail(idOrName: string | number): Observable<PokemonDetailResponse> {
    return this.http.get<PokemonDetailResponse>(`${this.baseUrl}/pokemon/${idOrName}`);
  }

  getPokemonEncounters(idOrName: string | number): Observable<PokemonEncounter[]> {
    return this.http.get<PokemonEncounter[]>(
      `${this.baseUrl}/pokemon/${idOrName}/encounters`,
    );
  }

  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpeciesResponse> {
    return this.http.get<PokemonSpeciesResponse>(`${this.baseUrl}/pokemon-species/${idOrName}`);
  }

  getEvolutionChainByUrl(url: string): Observable<EvolutionChainResponse> {
    return this.http.get<EvolutionChainResponse>(url);
  }
}
