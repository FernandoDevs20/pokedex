import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly searchTerm = input<string>('');
  readonly resetNonce = input(0);
  readonly searchSubmitted = output<string>();

  protected readonly query = signal('');

  constructor() {
    effect(() => {
      this.resetNonce();
      this.query.set(this.searchTerm());
    });
  }

  protected onQueryInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.query.set(target.value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.searchSubmitted.emit(this.query().trim());
  }
}
