import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly searchSubmitted = output<string>();

  protected readonly query = signal('');

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
