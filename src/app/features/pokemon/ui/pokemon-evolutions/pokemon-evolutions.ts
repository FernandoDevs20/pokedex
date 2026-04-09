import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PokemonTypeTag } from '../../../../shared/ui/pokemon-type-tag/pokemon-type-tag';
import { PokemonCryService } from '../../data-access/pokemon-cry.service';
import { PokemonCardModel } from '../../data-access/pokemon.models';

@Component({
  selector: 'app-pokemon-evolutions',
  imports: [PokemonTypeTag, RouterLink],
  templateUrl: './pokemon-evolutions.html',
  styleUrl: './pokemon-evolutions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonEvolutions {
  private readonly pokemonCryService = inject(PokemonCryService);

  readonly evolutions = input.required<PokemonCardModel[]>();
  readonly currentPokemonName = input<string | null>(null);

  protected readonly evolutionItems = computed(() =>
    this.evolutions().map((pokemon) => ({
      ...pokemon,
      nameLabel: pokemon.name
        .split('-')
        .filter((part) => part.length > 0)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' '),
      idLabel: `#${String(pokemon.id).padStart(3, '0')}`,
      isCurrent: this.currentPokemonName()?.toLowerCase() === pokemon.name.toLowerCase(),
    })),
  );

  protected onEvolutionNavigate(cryUrl: string | null | undefined): void {
    this.pokemonCryService.play(cryUrl ?? null);
  }
}
