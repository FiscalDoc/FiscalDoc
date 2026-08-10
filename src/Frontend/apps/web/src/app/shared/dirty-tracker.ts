// Rastreia "sujeira" de formulários simples ([(ngModel)] em objeto plano, sem FormGroup) por
// snapshot JSON comparado ao estado atual — usado pelo unsavedChangesGuard pra decidir se
// precisa confirmar antes de sair da tela. Cada seção independente (aba com botão "Salvar"
// próprio) usa uma chave separada: salvar uma aba não pode "limpar" a sujeira de outra que
// ainda tem alterações pendentes.
export class DirtyTracker {
  private readonly _snapshots = new Map<string, string>();

  snapshot(key: string, value: unknown): void {
    this._snapshots.set(key, JSON.stringify(value));
  }

  isDirty(key: string, value: unknown): boolean {
    const snap = this._snapshots.get(key);
    return snap !== undefined && snap !== JSON.stringify(value);
  }

  isAnyDirty(entries: Array<[string, unknown]>): boolean {
    return entries.some(([key, value]) => this.isDirty(key, value));
  }
}
