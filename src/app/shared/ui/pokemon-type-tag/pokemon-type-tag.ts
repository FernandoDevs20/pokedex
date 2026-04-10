import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type TypeStyle = {
  readonly background: string;
  readonly color: string;
};

const DEFAULT_TYPE_STYLE: TypeStyle = {
  background: '#7f8c8d',
  color: '#ffffff',
};

const TYPE_STYLE_MAP: Record<string, TypeStyle> = {
  normal: { background: '#a8a878', color: '#ffffff' },
  fire: { background: '#ee8130', color: '#ffffff' },
  water: { background: '#6390f0', color: '#ffffff' },
  electric: { background: '#f7d02c', color: '#1f1f1f' },
  grass: { background: '#7ac74c', color: '#ffffff' },
  ice: { background: '#96d9d6', color: '#1f1f1f' },
  fighting: { background: '#c22e28', color: '#ffffff' },
  poison: { background: '#a33ea1', color: '#ffffff' },
  ground: { background: '#e2bf65', color: '#1f1f1f' },
  flying: {
    background: 'linear-gradient(180deg, #7fa9ff 50%, #c7ced8 50%)',
    color: '#ffffff',
  },
  psychic: { background: '#f95587', color: '#ffffff' },
  bug: { background: '#a6b91a', color: '#ffffff' },
  rock: { background: '#b6a136', color: '#ffffff' },
  ghost: { background: '#735797', color: '#ffffff' },
  dragon: { background: '#6f35fc', color: '#ffffff' },
  dark: { background: '#705746', color: '#ffffff' },
  steel: { background: '#b7b7ce', color: '#1f1f1f' },
  fairy: { background: '#d685ad', color: '#ffffff' },
};

@Component({
  selector: 'app-pokemon-type-tag',
  imports: [],
  templateUrl: './pokemon-type-tag.html',
  styleUrl: './pokemon-type-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTypeTag {
  readonly type = input.required<string>();
  readonly size = input<'default' | 'large'>('default');

  protected readonly normalizedType = computed(() => this.type().trim().toLowerCase());

  protected readonly style = computed(
    () => TYPE_STYLE_MAP[this.normalizedType()] ?? DEFAULT_TYPE_STYLE,
  );

  protected readonly label = computed(() =>
    this.normalizedType()
      .split('-')
      .filter((word) => word.length > 0)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' '),
  );
}
