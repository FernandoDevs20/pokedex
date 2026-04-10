import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { LoaderOverlay } from '../../../../shared/ui/loader-overlay/loader-overlay';
import { PokeballIcon } from '../../../../shared/ui/pokeball-icon/pokeball-icon';
import { PokemonTypeTag } from '../../../../shared/ui/pokemon-type-tag/pokemon-type-tag';
import { PokemonApiService } from '../../data-access/pokemon-api.service';
import { PokemonCryService } from '../../data-access/pokemon-cry.service';
import { TYPE_COLOR_MAP, TYPE_WEAKNESS_MAP } from '../../domain/pokemon-type.constants';
import {
  EvolutionChainLink,
  PokemonCardModel,
  PokemonDetailResponse,
  PokemonSpeciesResponse,
} from '../../data-access/pokemon.models';
import { PokemonEvolutions } from '../../ui/pokemon-evolutions/pokemon-evolutions';
import { PokemonStats } from '../../ui/pokemon-stats/pokemon-stats';

@Component({
  selector: 'app-pokemon-detail',
  imports: [PokemonStats, PokemonTypeTag, PokemonEvolutions, LoaderOverlay, PokeballIcon],
  templateUrl: './pokemon-detail.html',
  styleUrl: './pokemon-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly pokemonApiService = inject(PokemonApiService);
  private readonly pokemonCryService = inject(PokemonCryService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pokemon = signal<PokemonDetailResponse | null>(null);
  protected readonly pokemonSpecies = signal<PokemonSpeciesResponse | null>(null);
  protected readonly selectedVersion = signal<'blue' | 'pink'>('blue');
  protected readonly evolutions = signal<PokemonCardModel[]>([]);
  protected readonly previousPokemon = signal<PokemonDetailResponse | null>(null);
  protected readonly nextPokemon = signal<PokemonDetailResponse | null>(null);

  protected readonly pokemonName = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return '';
    }

    return pokemonDetail.name
      .split('-')
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  });
  protected readonly pokemonIdLabel = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return '';
    }

    return String(pokemonDetail.id).padStart(4, '0');
  });
  protected readonly pokemonImageUrl = computed(
    () =>
      this.pokemon()?.sprites.other?.['official-artwork']?.front_default ??
      this.pokemon()?.sprites.front_default ??
      null,
  );
  protected readonly pokemonDescription = computed(() => {
    const species = this.pokemonSpecies();
    if (!species) {
      return '';
    }

    const descriptions = this.extractUniqueFlavorTextsByLanguage(species, 'en');

    if (descriptions.length === 0) {
      return 'No description available for this Pokemon.';
    }

    if (this.selectedVersion() === 'blue') {
      return descriptions[0];
    }

    return descriptions[1] ?? descriptions[0];
  });
  protected readonly pokemonHeightMeters = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return '0';
    }

    return this.formatDecimalValue(pokemonDetail.height / 10);
  });
  protected readonly pokemonWeightKg = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return '0';
    }

    return this.formatDecimalValue(pokemonDetail.weight / 10);
  });
  protected readonly pokemonCategory = computed(() => {
    const species = this.pokemonSpecies();
    if (!species) {
      return '';
    }

    const englishGenus = species.genera.find((item) => item.language.name === 'en')?.genus;
    if (englishGenus) {
      return englishGenus.replace(/\s*pok[eé]mon$/i, '').trim();
    }

    return 'Unknown';
  });
  protected readonly pokemonAbilitiesText = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return '';
    }

    const visibleAbilities = pokemonDetail.abilities.filter(
      (abilitySlot) => !abilitySlot.is_hidden,
    );
    const sourceAbilities =
      visibleAbilities.length > 0 ? visibleAbilities : pokemonDetail.abilities;

    return sourceAbilities
      .map((abilitySlot) => abilitySlot.ability.name)
      .map((abilityName) =>
        abilityName
          .split('-')
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(' '),
      )
      .join(', ');
  });
  protected readonly pokemonGenderText = computed(() => {
    const species = this.pokemonSpecies();
    if (!species) {
      return '—';
    }

    const genderRate = species.gender_rate;
    if (genderRate === -1) {
      return '⚲';
    }

    if (genderRate === 0) {
      return '♂';
    }

    if (genderRate === 8) {
      return '♀';
    }

    return '♂ ♀';
  });
  protected readonly pokemonTypes = computed(() => {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return [] as string[];
    }

    return pokemonDetail.types.map((typeSlot) => typeSlot.type.name);
  });
  protected readonly pokemonWeaknesses = computed(() => {
    const weaknesses = new Set<string>();

    for (const pokemonType of this.pokemonTypes()) {
      const typeWeaknesses = TYPE_WEAKNESS_MAP[pokemonType] ?? [];
      for (const weakness of typeWeaknesses) {
        weaknesses.add(weakness);
      }
    }

    return Array.from(weaknesses);
  });
  protected readonly canNavigateToPrevious = computed(() => {
    return !!this.previousPokemon() && !this.loading();
  });
  protected readonly canNavigateToNext = computed(() => !!this.nextPokemon() && !this.loading());

  protected readonly previousPokemonName = computed(() => {
    const previousPokemonDetail = this.previousPokemon();
    return previousPokemonDetail ? this.toPokemonDisplayName(previousPokemonDetail.name) : '';
  });

  protected readonly previousPokemonIdLabel = computed(() => {
    const previousPokemonDetail = this.previousPokemon();
    return previousPokemonDetail ? this.padId4(previousPokemonDetail.id) : '';
  });

  protected readonly nextPokemonName = computed(() => {
    const nextPokemonDetail = this.nextPokemon();
    return nextPokemonDetail ? this.toPokemonDisplayName(nextPokemonDetail.name) : '';
  });

  protected readonly nextPokemonIdLabel = computed(() => {
    const nextPokemonDetail = this.nextPokemon();
    return nextPokemonDetail ? this.padId4(nextPokemonDetail.id) : '';
  });

  protected readonly previousPokemonHoverColor = computed(() => {
    const firstType = this.previousPokemon()?.types[0]?.type.name?.toLowerCase();
    return (firstType && TYPE_COLOR_MAP[firstType]) || '#9d9d9d';
  });

  protected readonly nextPokemonHoverColor = computed(() => {
    const firstType = this.nextPokemon()?.types[0]?.type.name?.toLowerCase();
    return (firstType && TYPE_COLOR_MAP[firstType]) || '#9d9d9d';
  });
  protected readonly isBlueVersionSelected = computed(() => this.selectedVersion() === 'blue');
  protected readonly isPinkVersionSelected = computed(() => this.selectedVersion() === 'pink');

  constructor() {
    this.loadPokemonDetailFromRoute();
  }

  protected onPreviousPokemon(): void {
    const previousPokemonDetail = this.previousPokemon();
    if (!previousPokemonDetail) {
      return;
    }

    void this.router.navigate(['/pokemon', previousPokemonDetail.name]);
  }

  protected onNextPokemon(): void {
    const nextPokemonDetail = this.nextPokemon();
    if (!nextPokemonDetail) {
      return;
    }

    void this.router.navigate(['/pokemon', nextPokemonDetail.name]);
  }

  protected onPokemonImageClick(): void {
    const pokemonDetail = this.pokemon();
    if (!pokemonDetail) {
      return;
    }

    this.pokemonCryService.play(pokemonDetail.cries?.latest ?? pokemonDetail.cries?.legacy ?? null);
  }

  protected onBlueVersionClick(): void {
    this.selectedVersion.set('blue');
  }

  protected onPinkVersionClick(): void {
    this.selectedVersion.set('pink');
  }

  private loadPokemonDetailFromRoute(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('name')?.trim() || 'ivysaur'),
        switchMap((name) => {
          this.loading.set(true);
          this.error.set(null);
          this.pokemon.set(null);
          this.pokemonSpecies.set(null);
          this.selectedVersion.set('blue');
          this.evolutions.set([]);
          this.previousPokemon.set(null);
          this.nextPokemon.set(null);

          return this.pokemonApiService.getPokemonDetail(name).pipe(
            switchMap((pokemonDetailResponse) =>
              this.pokemonApiService.getPokemonSpecies(pokemonDetailResponse.species.name).pipe(
                switchMap((pokemonSpeciesResponse) =>
                  this.loadEvolutionCardsFromSpecies(pokemonSpeciesResponse).pipe(
                    catchError(() => of([])),
                    map((evolutionCards) => ({
                      pokemonDetailResponse,
                      pokemonSpeciesResponse,
                      evolutionCards,
                    })),
                  ),
                ),
                catchError(() =>
                  of({
                    pokemonDetailResponse,
                    pokemonSpeciesResponse: null,
                    evolutionCards: [] as PokemonCardModel[],
                  }),
                ),
              ),
            ),
            tap(({ pokemonDetailResponse }) => {
              this.loadPreviousAndNext(pokemonDetailResponse.id);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ pokemonDetailResponse, pokemonSpeciesResponse, evolutionCards }) => {
          this.pokemon.set(pokemonDetailResponse);
          this.pokemonSpecies.set(pokemonSpeciesResponse);
          this.evolutions.set(evolutionCards);
          this.title.setTitle(
            `${this.toPokemonDisplayName(pokemonDetailResponse.name)} N.° ${this.padId4(pokemonDetailResponse.id)} | Pokedex`,
          );
        },
        error: () => {
          this.error.set('No se pudo cargar el detalle del Pokemon.');
          this.pokemon.set(null);
          this.pokemonSpecies.set(null);
          this.evolutions.set([]);
          this.title.setTitle('Pokemon detail | Pokedex');
        },
      });
  }

  private loadPreviousAndNext(currentPokemonId: number): void {
    const previousPokemonId = currentPokemonId - 1;
    const nextPokemonId = currentPokemonId + 1;

    const previousPokemonRequest =
      previousPokemonId >= 1
        ? this.pokemonApiService
            .getPokemonDetail(previousPokemonId)
            .pipe(catchError(() => of(null)))
        : of(null);

    const nextPokemonRequest = this.pokemonApiService
      .getPokemonDetail(nextPokemonId)
      .pipe(catchError(() => of(null)));

    forkJoin([previousPokemonRequest, nextPokemonRequest])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([previousPokemonDetail, nextPokemonDetail]) => {
        this.previousPokemon.set(previousPokemonDetail);
        this.nextPokemon.set(nextPokemonDetail);
      });
  }

  private loadEvolutionCardsFromSpecies(pokemonSpeciesResponse: PokemonSpeciesResponse) {
    return this.pokemonApiService
      .getEvolutionChainByUrl(pokemonSpeciesResponse.evolution_chain.url)
      .pipe(
        map((evolutionChainResponse) => this.extractEvolutionNames(evolutionChainResponse.chain)),
        switchMap((evolutionNames) =>
          forkJoin(
            evolutionNames.map((evolutionName) =>
              this.pokemonApiService.getPokemonDetail(evolutionName),
            ),
          ),
        ),
        map((pokemonDetails) =>
          pokemonDetails
            .sort((a, b) => a.id - b.id)
            .map((pokemonDetail) => this.toPokemonCardModel(pokemonDetail)),
        ),
      );
  }

  private extractUniqueFlavorTextsByLanguage(
    pokemonSpeciesResponse: PokemonSpeciesResponse,
    language: 'es' | 'en',
  ): string[] {
    const normalizedTexts = pokemonSpeciesResponse.flavor_text_entries
      .filter((entry) => entry.language.name === language)
      .map((entry) => this.normalizeFlavorText(entry.flavor_text))
      .filter((text) => text.length > 0);

    return Array.from(new Set(normalizedTexts));
  }

  private normalizeFlavorText(value: string): string {
    return value.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private formatDecimalValue(value: number): string {
    const fixed = value.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }

  private extractEvolutionNames(chainLink: EvolutionChainLink): string[] {
    const evolutionNames: string[] = [];

    const walkChain = (currentLink: EvolutionChainLink): void => {
      evolutionNames.push(currentLink.species.name);
      currentLink.evolves_to.forEach((nextLink) => walkChain(nextLink));
    };

    walkChain(chainLink);

    return Array.from(new Set(evolutionNames));
  }

  private toPokemonCardModel(pokemonDetailResponse: PokemonDetailResponse): PokemonCardModel {
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

  private padId4(pokemonId: number): string {
    return String(pokemonId).padStart(4, '0');
  }

  private toPokemonDisplayName(pokemonName: string): string {
    return pokemonName
      .split('-')
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}
