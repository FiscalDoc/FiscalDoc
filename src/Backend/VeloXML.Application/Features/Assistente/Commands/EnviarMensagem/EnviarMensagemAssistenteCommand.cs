using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Assistente.Commands.EnviarMensagem;

public record ChatMensagemInput(string Papel, string Texto);

public record EnviarMensagemAssistenteCommand(
    List<ChatMensagemInput> Mensagens,
    Guid? ClienteId,
    Guid? PedidoId
) : IRequest<Result<string>>;
