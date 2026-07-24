import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'default';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [class]="'badge-' + variant()"><ng-content /></span>`,
  styles: [`
    :host { display: inline-flex; }
  `],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
}
