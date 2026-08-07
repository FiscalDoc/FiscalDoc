import { Directive, ElementRef, HostListener, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Input de valor monetário no padrão "máscara de centavos" (tipo app de banco/POS): os dígitos
// digitados preenchem da direita pra esquerda, sempre 2 casas decimais — digitar "5" mostra
// "0,05", digitar "500" mostra "5,00". Nunca precisa digitar vírgula, e o campo nunca fica sem
// as 2 casas (ex.: "4,5" solto, que ficava diferente de "4,50").
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
  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private _el: ElementRef<HTMLInputElement>, private _renderer: Renderer2) {
    this._renderer.setAttribute(this._el.nativeElement, 'inputmode', 'numeric');
  }

  writeValue(value: number | null): void {
    this._value = value ?? 0;
    this._render(this._format(this._value));
  }

  registerOnChange(fn: (value: number) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setProperty(this._el.nativeElement, 'disabled', isDisabled);
  }

  @HostListener('focus')
  onFocus(): void {
    // Seleciona tudo — se o usuário começar a digitar, substitui o valor inteiro em vez de
    // inserir no meio (comportamento esperado pra máscara de centavos).
    this._el.nativeElement.select();
  }

  @HostListener('blur')
  onBlur(): void {
    this._onTouched();
  }

  @HostListener('input', ['$event.target.value'])
  onInput(raw: string): void {
    const digitos = raw.replace(/\D/g, '');
    const centavos = digitos === '' ? 0 : parseInt(digitos, 10);
    this._value = centavos / 100;
    this._render(this._format(this._value));
    this._onChange(this._value);

    const pos = this._el.nativeElement.value.length;
    this._el.nativeElement.setSelectionRange(pos, pos);
  }

  private _format(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _render(text: string): void {
    this._renderer.setProperty(this._el.nativeElement, 'value', text);
  }
}
