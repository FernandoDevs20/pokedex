import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

type ButtonType = 'button' | 'submit' | 'reset';
type IconAnimation = 'none' | 'rotate-hover' | 'rotate-always' | 'rotate-hover-click';

@Component({
  selector: 'app-common-button',
  imports: [],
  templateUrl: './common-button.html',
  styleUrl: './common-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonButton {
  readonly text = input('Button');
  readonly buttonType = input<ButtonType>('button');
  readonly disabled = input(false);
  readonly iconPath = input('');
  readonly iconViewBox = input('0 0 24 24');
  readonly iconAnimation = input<IconAnimation>('none');
  readonly buttonPressed = output<void>();

  protected readonly hasIcon = computed(() => this.iconPath().trim().length > 0);
  protected readonly isClickRotating = signal(false);
  protected readonly shouldRotateOnHover = computed(
    () => this.iconAnimation() === 'rotate-hover' || this.iconAnimation() === 'rotate-hover-click',
  );

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }

    if (this.iconAnimation() === 'rotate-hover-click') {
      this.isClickRotating.set(true);
    }

    this.buttonPressed.emit();
  }

  protected onIconAnimationEnd(): void {
    if (this.isClickRotating()) {
      this.isClickRotating.set(false);
    }
  }
}
