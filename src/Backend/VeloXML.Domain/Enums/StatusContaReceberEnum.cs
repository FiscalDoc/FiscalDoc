namespace VeloXML.Domain.Enums;

public enum StatusContaReceberEnum
{
    Pendente  = 0,
    Pago      = 1,
    Cancelado = 2
    // "Atrasado" não é um valor gravado — é Pendente com DataVencimento no passado, calculado
    // na hora de listar (mesmo raciocínio já usado pro status de Pedido/Documento: menos um
    // lugar pra esquecer de manter sincronizado).
}
