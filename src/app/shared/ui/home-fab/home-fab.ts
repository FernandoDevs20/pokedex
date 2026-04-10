import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-fab',
  imports: [RouterLink],
  templateUrl: './home-fab.html',
  styleUrl: './home-fab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFab {
  readonly ariaLabel = input('Back to home');
}
