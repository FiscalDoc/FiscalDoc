import { Pipe, PipeTransform } from '@angular/core';
import { TipoDocumento } from '../../../models/src/index';

const LABELS: Record<TipoDocumento, string> = {
  NFe:    'NF-e',
  CTe:    'CT-e',
  MDFe:   'MDF-e',
  NFSe:   'NFS-e',
  PDF:    'PDF',
  Imagem: 'Imagem',
  XML:    'XML',
};

@Pipe({ name: 'documentType', standalone: true })
export class DocumentTypePipe implements PipeTransform {
  transform(value: TipoDocumento | null | undefined): string {
    if (!value) return '';
    return LABELS[value] ?? value;
  }
}
