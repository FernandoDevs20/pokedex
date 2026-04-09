import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HomeFab } from './shared/ui/home-fab/home-fab';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomeFab],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = signal('pokedex');
  private readonly currentUrl = signal(this.router.url);

  protected readonly showHomeFab = computed(() => this.currentUrl().startsWith('/pokemon/'));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.currentUrl.set(this.router.url));
  }
}
