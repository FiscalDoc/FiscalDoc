using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveIntervaloImportacao;

public record SaveIntervaloImportacaoCommand(int IntervaloMinutos) : IRequest<Result<int>>;
