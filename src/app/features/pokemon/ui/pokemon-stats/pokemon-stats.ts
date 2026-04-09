import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PokemonStat } from '../../data-access/pokemon.models';

type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

interface StatDescriptor {
  key: StatKey;
  label: string;
}

interface PokemonStatViewModel {
  key: StatKey;
  label: string;
  value: number;
  filledBlocks: number;
}

const STAT_DESCRIPTORS: StatDescriptor[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Special Attack' },
  { key: 'special-defense', label: 'Special Defense' },
  { key: 'speed', label: 'Speed' },
];

@Component({
  selector: 'app-pokemon-stats',
  imports: [],
  templateUrl: './pokemon-stats.html',
  styleUrl: './pokemon-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonStats {
  readonly stats = input.required<PokemonStat[]>();
  private readonly totalBlocks = 10;
  protected readonly blockIndexes = Array.from({ length: this.totalBlocks }, (_, index) => index);

  protected readonly statItems = computed<PokemonStatViewModel[]>(() => {
    const statsMap = new Map(this.stats().map((statItem) => [statItem.stat.name, statItem]));

    return STAT_DESCRIPTORS.map(({ key, label }) => {
      const matchedStat = statsMap.get(key);
      const value = matchedStat?.base_stat ?? 0;
      const filledBlocks = Math.max(
        0,
        Math.min(this.totalBlocks, Math.round((value / 255) * this.totalBlocks)),
      );

      return {
        key,
        label,
        value,
        filledBlocks,
      };
    });
  });
}
