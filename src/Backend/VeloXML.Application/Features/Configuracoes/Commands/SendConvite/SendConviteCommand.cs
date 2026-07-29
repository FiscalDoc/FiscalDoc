using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SendConvite;

public record SendConviteCommand(string Nome, string Email) : IRequest<Result>;
