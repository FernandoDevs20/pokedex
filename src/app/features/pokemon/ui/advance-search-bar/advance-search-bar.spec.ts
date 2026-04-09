import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSearchBar } from './advance-search-bar';

describe('AdvanceSearchBar', () => {
  let component: AdvanceSearchBar;
  let fixture: ComponentFixture<AdvanceSearchBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvanceSearchBar],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvanceSearchBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
