using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetFocusNfeConfig;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveFocusNfeConfig;

// Cada campo só é atualizado quando informado (null = "não mexer") — mesmo padrão da senha
// SMTP, pra não obrigar o Admin a redigitar um token que já está salvo só pra trocar outro.
public record SaveFocusNfeConfigCommand(
    string? TokenHomologacao,
    string? TokenProducao,
    string? WebhookSecret
) : IRequest<Result<FocusNfeConfigDto>>;
