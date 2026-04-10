import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, tap, throwError } from 'rxjs';
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
  private readonly CACHE_TTL_MS = 5 * 60_000;

  private readonly cacheStore = new Map<string, { expiresAt: number; value: unknown }>();
  private readonly inFlightStore = new Map<string, Observable<unknown>>();

  getPokemonList(limit = 20, offset = 0): Observable<PokemonListResponse> {
    const params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));

    return this.cachedGet<PokemonListResponse>(
      `${this.baseUrl}/pokemon`,
      { params },
      'getPokemonList',
    );
  }

  getPokemonDetail(idOrName: string | number): Observable<PokemonDetailResponse> {
    return this.cachedGet<PokemonDetailResponse>(
      `${this.baseUrl}/pokemon/${encodeURIComponent(String(idOrName))}`,
      undefined,
      'getPokemonDetail',
    );
  }

  getPokemonEncounters(idOrName: string | number): Observable<PokemonEncounter[]> {
    return this.cachedGet<PokemonEncounter[]>(
      `${this.baseUrl}/pokemon/${encodeURIComponent(String(idOrName))}/encounters`,
      undefined,
      'getPokemonEncounters',
    );
  }

  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpeciesResponse> {
    return this.cachedGet<PokemonSpeciesResponse>(
      `${this.baseUrl}/pokemon-species/${encodeURIComponent(String(idOrName))}`,
      undefined,
      'getPokemonSpecies',
    );
  }

  getEvolutionChainByUrl(url: string): Observable<EvolutionChainResponse> {
    return this.cachedGet<EvolutionChainResponse>(url, undefined, 'getEvolutionChainByUrl');
  }

  private cachedGet<T>(
    url: string,
    options: { params?: HttpParams } | undefined,
    operation: PokemonApiOperation,
  ): Observable<T> {
    this.purgeExpired();

    const cacheKey = this.buildCacheKey(operation, url, options?.params);
    const cachedEntry = this.cacheStore.get(cacheKey);
    if (cachedEntry) {
      return of(cachedEntry.value as T);
    }

    const inFlightRequest = this.inFlightStore.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest as Observable<T>;
    }

    const request$ = this.http.get<T>(url, options).pipe(
      tap((value) => {
        this.purgeExpired();
        this.cacheStore.set(cacheKey, {
          expiresAt: this.now() + this.CACHE_TTL_MS,
          value,
        });
      }),
      catchError((error: unknown) => throwError(() => toPokemonApiError(operation, error))),
      finalize(() => {
        this.inFlightStore.delete(cacheKey);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlightStore.set(cacheKey, request$);
    return request$;
  }

  private buildCacheKey(
    operation: PokemonApiOperation,
    url: string,
    params: HttpParams | undefined,
  ): string {
    if (!params || params.keys().length === 0) {
      return `${operation}|${url}`;
    }

    const normalizedParams = params
      .keys()
      .sort((a, b) => a.localeCompare(b))
      .flatMap((key) => {
        const values = params.getAll(key) ?? [];
        if (values.length === 0) {
          return `${encodeURIComponent(key)}=`;
        }

        return [...values]
          .sort((a, b) => a.localeCompare(b))
          .map((value) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      })
      .join('&');

    return `${operation}|${url}|${normalizedParams}`;
  }

  private purgeExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.cacheStore.entries()) {
      if (entry.expiresAt <= now) {
        this.cacheStore.delete(key);
      }
    }
  }

  private now(): number {
    return Date.now();
  }
}
