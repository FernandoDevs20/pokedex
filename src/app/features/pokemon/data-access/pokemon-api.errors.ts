import { HttpErrorResponse } from '@angular/common/http';

export type PokemonApiOperation =
  | 'getPokemonList'
  | 'getPokemonDetail'
  | 'getPokemonEncounters'
  | 'getPokemonSpecies'
  | 'getEvolutionChainByUrl';

export type PokemonApiErrorCode = 'network' | 'not-found' | 'rate-limited' | 'server' | 'unknown';

export interface PokemonApiError extends Error {
  readonly operation: PokemonApiOperation;
  readonly code: PokemonApiErrorCode;
  readonly status: number | null;
  readonly cause: unknown;
}

export function toPokemonApiError(operation: PokemonApiOperation, error: unknown): PokemonApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return createPokemonApiError(operation, 'unknown', null, error, 'Unexpected API error');
  }

  const status = Number.isInteger(error.status) ? error.status : null;
  if (status === 0) {
    return createPokemonApiError(operation, 'network', 0, error, 'Network error');
  }

  if (status === 404) {
    return createPokemonApiError(operation, 'not-found', status, error, 'Resource not found');
  }

  if (status === 429) {
    return createPokemonApiError(operation, 'rate-limited', status, error, 'Rate limit exceeded');
  }

  if (status !== null && status >= 500) {
    return createPokemonApiError(operation, 'server', status, error, 'Server error');
  }

  return createPokemonApiError(operation, 'unknown', status, error, 'API error');
}

function createPokemonApiError(
  operation: PokemonApiOperation,
  code: PokemonApiErrorCode,
  status: number | null,
  cause: unknown,
  message: string,
): PokemonApiError {
  const apiError = new Error(message) as PokemonApiError;
  Object.defineProperties(apiError, {
    operation: { value: operation, enumerable: true },
    code: { value: code, enumerable: true },
    status: { value: status, enumerable: true },
    cause: { value: cause, enumerable: true },
  });
  return apiError;
}
