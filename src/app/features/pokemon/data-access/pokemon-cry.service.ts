import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PokemonCryService {
  private readonly platformId = inject(PLATFORM_ID);

  // Single shared audio element so cries don't overlap.
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  play(url: string | null | undefined): void {
    const normalizedUrl = url?.trim() || null;
    if (!normalizedUrl) {
      return;
    }

    // SSR safety.
    if (!isPlatformBrowser(this.platformId) || typeof Audio === 'undefined') {
      return;
    }

    const audio = (this.audio ??= new Audio());

    // Restart if the same cry is clicked again.
    if (this.currentUrl !== normalizedUrl) {
      this.currentUrl = normalizedUrl;
      audio.src = normalizedUrl;
      audio.preload = 'auto';
    }

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Some browsers can throw if the resource isn't ready yet.
    }

    void audio.play().catch(() => {
      // Ignore playback errors (e.g. format not supported, user gesture policies).
    });
  }

  stop(): void {
    if (!this.audio) {
      return;
    }

    try {
      this.audio.pause();
      this.audio.currentTime = 0;
    } catch {
      // no-op
    }
  }
}
