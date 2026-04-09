import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonButton } from './common-button';

describe('CommonButton', () => {
  let component: CommonButton;
  let fixture: ComponentFixture<CommonButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonButton],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit buttonPressed on click', () => {
    const emitSpy = spyOn(component.buttonPressed, 'emit');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
