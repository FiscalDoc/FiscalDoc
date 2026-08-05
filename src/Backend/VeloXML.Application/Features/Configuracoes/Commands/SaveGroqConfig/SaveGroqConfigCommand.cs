using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetGroqConfig;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveGroqConfig;

public record SaveGroqConfigCommand(string? ApiKey) : IRequest<Result<GroqConfigDto>>;
