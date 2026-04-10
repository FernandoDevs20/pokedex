import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';

@Component({
  selector: 'app-scroll-top-fab',
  templateUrl: './scroll-top-fab.html',
  styleUrl: './scroll-top-fab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollTopFab {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isVisible = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.updateVisibility();

    fromEvent(window, 'scroll')
      .pipe(auditTime(80), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateVisibility());
  }

  protected onScrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  private updateVisibility(): void {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    this.isVisible.set(scrollY > 220);
  }
}
