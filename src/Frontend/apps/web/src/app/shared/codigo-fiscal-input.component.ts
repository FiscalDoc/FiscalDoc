import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CFOP_COMUNS, NCM_COMUNS, CodigoFiscalSugestao } from './ncm-cfop.data';

// Campo de NCM/CFOP com busca embutida — cobre a lacuna de "o usuário precisa já saber o código
// de cabeça" apontada no audit de usabilidade de emissão. Filtra por código OU descrição contra
// uma lista curada (não a tabela oficial completa), então é reaproveitado em qualquer tela que
// tenha um campo desses (cadastro de Produto, item do pedido, criação rápida de produto), com
// `[(value)]` (banana-in-a-box funciona com qualquer par Input/Output "X"/"XChange", sem precisar
// de ControlValueAccessor).
@Component({
  selector: 'app-codigo-fiscal-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cf-wrap">
      <input
        class="cf-input" [class.cf-input-sm]="size === 'sm'" [class.error]="showError"
        [ngModel]="value" (ngModelChange)="onInput($event)"
        (focus)="aberto.set(true)" (blur)="onBlur()"
        [disabled]="disabled" [placeholder]="placeholder || (tipo === 'ncm' ? '0000.00.00' : '5102')"
        [maxLength]="maxLength"
      />
      @if (aberto() && !disabled) {
        <div class="cf-dropdown">
          @if (sugestoes().length > 0) {
            @for (s of sugestoes(); track s.codigo) {
              <div class="cf-item" (mousedown)="selecionar(s)">
                <span class="cf-codigo">{{ s.codigo }}</span>
                <span class="cf-desc">{{ s.descricao }}</span>
              </div>
            }
          } @else {
            <div class="cf-item cf-item-hint">Nenhuma sugestão — digite o código direto.</div>
          }
          <div class="cf-footer">Sugestão aproximada — confira com o contador antes de emitir.</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cf-wrap { position: relative; }
    .cf-input {
      width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .cf-input-sm { padding: .375rem .5rem; font-size: 12.5px; border-radius: 6px; }
    .cf-input:focus { border-color: var(--accent); }
    .cf-input:disabled { opacity: .55; cursor: not-allowed; }
    .cf-input.error { border-color: var(--red); }

    .cf-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
      background: var(--bg2); border: 1px solid var(--border2); border-radius: 8px;
      box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,.35));
      max-height: 260px; overflow-y: auto; padding: 4px;
    }
    .cf-item { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
    .cf-item:hover { background: var(--bg3); }
    .cf-item-hint { color: var(--text2); font-size: 12px; cursor: default; }
    .cf-item-hint:hover { background: none; }
    .cf-codigo { font-size: 12.5px; font-weight: 600; color: var(--accent); font-family: monospace; }
    .cf-desc { font-size: 11.5px; color: var(--text2); }
    .cf-footer { padding: 6px 8px 2px; font-size: 10.5px; color: var(--text3); border-top: 1px solid var(--border); margin-top: 2px; }
  `],
})
export class CodigoFiscalInputComponent {
  @Input() tipo: 'ncm' | 'cfop' = 'ncm';
  @Input() value = '';
  @Input() disabled = false;
  @Input() placeholder = '';
  @Input() maxLength = 14;
  @Input() size: 'normal' | 'sm' = 'normal';
  @Input() showError = false;
  @Output() valueChange = new EventEmitter<string>();

  readonly aberto = signal(false);

  private get base(): CodigoFiscalSugestao[] {
    return this.tipo === 'ncm' ? NCM_COMUNS : CFOP_COMUNS;
  }

  sugestoes(): CodigoFiscalSugestao[] {
    const q = (this.value || '').trim().toLowerCase();
    if (!q) return this.base.slice(0, 8);
    return this.base
      .filter(s => s.codigo.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q))
      .slice(0, 8);
  }

  onInput(v: string): void {
    this.value = v;
    this.valueChange.emit(v);
  }

  onBlur(): void {
    // Delay pra deixar o (mousedown) do item da lista disparar antes do blur fechar o dropdown.
    setTimeout(() => this.aberto.set(false), 150);
  }

  selecionar(s: CodigoFiscalSugestao): void {
    this.value = s.codigo;
    this.valueChange.emit(s.codigo);
    this.aberto.set(false);
  }
}
