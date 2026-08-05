using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetGroqConfig;

public record GetGroqConfigQuery : IRequest<Result<GroqConfigDto>>;

// A chave nunca volta pro frontend — só se já está configurada ou não, mesmo padrão dos
// tokens da Focus NFe (write-only).
public record GroqConfigDto(bool ApiKeyConfigurada);
