import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loader-overlay',
  imports: [NgOptimizedImage],
  templateUrl: './loader-overlay.html',
  styleUrl: './loader-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderOverlay {
  readonly visible = input(false);
  readonly imageSrc = input('/pokeball.png');
  readonly alt = input('Loading content');
  readonly size = input(90);
}
