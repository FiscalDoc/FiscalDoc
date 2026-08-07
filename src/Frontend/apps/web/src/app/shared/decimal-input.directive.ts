import { Directive, ElementRef, HostListener, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Input de valor monetário/decimal que sempre mostra 2 casas (ex.: "4,50", "0,00") quando não
// está em foco — <input type="number"> nativo nunca preenche zero à direita, então "4,5"
// ficava parecendo diferente de "4,50". Enquanto o usuário digita, mostra o valor "cru" (sem
// forçar formatação a cada tecla), e só reformata no blur.
@Directive({
  selector: 'input[appDecimalInput]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DecimalInputDirective),
    multi: true,
  }],
})
export class DecimalInputDirective implements ControlValueAccessor {
  private _value = 0;
  private _focused = false;
  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private _el: ElementRef<HTMLInputElement>, private _renderer: Renderer2) {
    this._renderer.setAttribute(this._el.nativeElement, 'inputmode', 'decimal');
  }

  writeValue(value: number | null): void {
    this._value = value ?? 0;
    if (!this._focused) this._render(this._format(this._value));
  }

  registerOnChange(fn: (value: number) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setProperty(this._el.nativeElement, 'disabled', isDisabled);
  }

  @HostListener('focus')
  onFocus(): void {
    this._focused = true;
    this._render(this._value === 0 ? '' : String(this._value).replace('.', ','));
    this._el.nativeElement.select();
  }

  @HostListener('blur')
  onBlur(): void {
    this._focused = false;
    this._onTouched();
    this._render(this._format(this._value));
  }

  @HostListener('input', ['$event.target.value'])
  onInput(raw: string): void {
    // Só dígitos e uma vírgula/ponto decimal — aceita as duas teclas, sempre normaliza pra vírgula.
    const cleaned = raw.replace(/[^\d,.-]/g, '');
    const partes = cleaned.split(/[,.]/);
    const normalizado = partes.length > 1 ? `${partes[0]},${partes.slice(1).join('')}` : cleaned;
    this._render(normalizado);

    const num = parseFloat(normalizado.replace(',', '.'));
    this._value = isNaN(num) ? 0 : num;
    this._onChange(this._value);
  }

  private _format(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _render(text: string): void {
    this._renderer.setProperty(this._el.nativeElement, 'value', text);
  }
}
