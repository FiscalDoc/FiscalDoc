using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlStatus;

public record GetImportacaoXmlStatusQuery : IRequest<Result<ImportacaoXmlStatusDto?>>;

public record ImportacaoXmlStatusDto(
    DateTime ExecutadoEm,
    int ClientesProcessados,
    int EmailsEncontrados,
    int XmlsProcessados,
    int XmlsImportados,
    int Erros
);
