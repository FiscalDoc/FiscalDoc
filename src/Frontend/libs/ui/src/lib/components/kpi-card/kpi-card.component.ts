import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card kpi-card">
      <p class="label">{{ label() }}</p>
      <p class="value font-heading">{{ value() }}</p>
      @if (delta()) {
        <p class="delta" [class.positive]="(deltaValue() ?? 0) >= 0">
          {{ delta() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .kpi-card { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.08em; }
    .value { font-size: 28px; font-weight: 700; color: var(--text); }
    .delta { font-size: 12px; color: var(--red); }
    .delta.positive { color: var(--accent); }
  `],
})
export class KpiCardComponent {
  label   = input.required<string>();
  value   = input.required<string | number>();
  delta   = input<string>();
  deltaValue = input<number>();
}
