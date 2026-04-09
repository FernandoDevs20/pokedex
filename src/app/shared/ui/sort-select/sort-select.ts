import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PokeballIcon } from '../pokeball-icon/pokeball-icon';

export interface SortSelectOption {
  value: string;
  label: string;
}

let nextSortSelectId = 0;

@Component({
  selector: 'app-sort-select',
  imports: [PokeballIcon],
  templateUrl: './sort-select.html',
  styleUrl: './sort-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortSelect {
  private readonly instanceId = `app-sort-select-${(nextSortSelectId += 1)}`;

  readonly label = input('Sort results');
  readonly value = input<string>('');
  readonly options = input<ReadonlyArray<SortSelectOption>>([]);
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  protected readonly selectId = computed(() => this.instanceId);
  protected readonly selectedText = computed(() => {
    const value = this.value();
    const option = this.options().find((item) => item.value === value);
    return option?.label ?? this.label();
  });

  protected onChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.valueChange.emit(target.value);
  }
}
