import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PokemonTypeTag } from '../../../../shared/ui/pokemon-type-tag/pokemon-type-tag';
import { PokemonCardModel } from '../../data-access/pokemon.models';
import { TYPE_COLOR_MAP } from '../../domain/pokemon-type.constants';

@Component({
  selector: 'app-pokemon-card',
  imports: [PokemonTypeTag, RouterLink],
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonCardModel>();

  protected readonly pokemonIdText = computed(() => {
    const pokemonId = this.pokemon().id;
    return `# ${String(pokemonId).padStart(3, '0')}`;
  });

  protected readonly pokemonNameText = computed(() => {
    const pokemonName = this.pokemon().name;
    return pokemonName
      .split('-')
      .filter((namePart) => namePart.length > 0)
      .map((namePart) => namePart[0].toUpperCase() + namePart.slice(1))
      .join(' ');
  });

  protected readonly firstTypeHoverColor = computed(() => {
    const firstType = this.pokemon().types[0]?.toLowerCase();
    if (!firstType) {
      return '#e5e5e5';
    }

    return TYPE_COLOR_MAP[firstType] ?? '#e5e5e5';
  });
}
