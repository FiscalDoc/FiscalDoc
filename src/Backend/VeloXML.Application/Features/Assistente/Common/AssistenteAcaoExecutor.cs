using System.Text.Json;
using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Application.Features.Usuarios.Commands.CreateClienteUsuario;

namespace VeloXML.Application.Features.Assistente.Common;

// Executa (ou só descreve, se ainda não confirmado) uma ferramenta de cadastro chamada pelo
// assistente. O texto retornado é sempre a mensagem de "resultado da ferramenta" que volta pro
// modelo (não é mostrado direto ao usuário) — por isso é redigido em 3ª pessoa/instrução, pro
// modelo reformular em linguagem natural na resposta final.
internal static class AssistenteAcaoExecutor
{
    public static async Task<string> ExecutarAsync(IMediator mediator, string nomeFerramenta, string argumentosJson, Guid clienteId, CancellationToken ct)
    {
        JsonElement root;
        try
        {
            using var doc = JsonDocument.Parse(argumentosJson);
            root = doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            return "ERRO: os argumentos enviados não são um JSON válido. Peça os dados novamente ao usuário.";
        }

        var confirmado = root.TryGetProperty("confirmado", out var confEl) && confEl.ValueKind == JsonValueKind.True;

        return nomeFerramenta switch
        {
            "cadastrar_produto" => await CadastrarProdutoAsync(mediator, root, confirmado, clienteId, ct),
            "cadastrar_destinatario" => await CadastrarDestinatarioAsync(mediator, root, confirmado, clienteId, ct),
            "cadastrar_usuario" => await CadastrarUsuarioAsync(mediator, root, confirmado, clienteId, ct),
            _ => "ERRO: ferramenta desconhecida.",
        };
    }

    private static string? Texto(JsonElement root, string prop) =>
        root.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.String ? el.GetString() : null;

    private static async Task<string> CadastrarProdutoAsync(IMediator mediator, JsonElement root, bool confirmado, Guid clienteId, CancellationToken ct)
    {
        var codigo = Texto(root, "codigo") ?? "";
        var descricao = Texto(root, "descricao") ?? "";
        var unidade = Texto(root, "unidade") ?? "UN";
        var preco = root.TryGetProperty("precoUnitario", out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : 0m;

        if (!confirmado)
            return $"AINDA NÃO CRIADO — pendente de confirmação. Resumo pra mostrar ao usuário: produto \"{descricao}\" (código {codigo}), unidade {unidade}, preço unitário R$ {preco:N2}. Pergunte se os dados estão corretos e se pode cadastrar; só chame a ferramenta de novo com confirmado=true depois de uma resposta afirmativa clara.";

        var result = await mediator.Send(new CreateProdutoCommand(clienteId, codigo, descricao, null, unidade, preco, null, 0, 0, 0), ct);

        return result.IsSuccess
            ? $"CRIADO COM SUCESSO. Produto \"{descricao}\" (código {codigo}) cadastrado, id {result.Value.Id}. Avise o usuário que já pode complementar dados fiscais (NCM, CFOP, CST) no cadastro do produto quando for emitir nota com ele."
            : $"ERRO ao cadastrar: {result.Error.Description}. Explique o erro ao usuário e pergunte se quer tentar de novo com dados diferentes.";
    }

    private static async Task<string> CadastrarDestinatarioAsync(IMediator mediator, JsonElement root, bool confirmado, Guid clienteId, CancellationToken ct)
    {
        var razaoSocial = Texto(root, "razaoSocial") ?? "";
        var cpfCnpj = Texto(root, "cpfCnpj");
        var email = Texto(root, "email");
        var telefone = Texto(root, "telefone");
        var cidade = Texto(root, "cidade");
        var estado = Texto(root, "estado");

        if (!confirmado)
        {
            var detalhes = string.Join(", ", new[]
            {
                cpfCnpj is not null ? $"CPF/CNPJ {cpfCnpj}" : null,
                email is not null ? $"e-mail {email}" : null,
                telefone is not null ? $"telefone {telefone}" : null,
                cidade is not null ? $"cidade {cidade}{(estado is not null ? $"/{estado}" : "")}" : null,
            }.Where(s => s is not null));

            return $"AINDA NÃO CRIADO — pendente de confirmação. Resumo pra mostrar ao usuário: destinatário \"{razaoSocial}\"{(detalhes.Length > 0 ? $" ({detalhes})" : "")}. Pergunte se os dados estão corretos e se pode cadastrar; só chame a ferramenta de novo com confirmado=true depois de uma resposta afirmativa clara.";
        }

        var result = await mediator.Send(new CreateDestinatarioCommand(
            clienteId, razaoSocial, null, cpfCnpj, null, email, telefone, null, null, null, null, cidade, estado, null, null), ct);

        return result.IsSuccess
            ? $"CRIADO COM SUCESSO. Destinatário \"{razaoSocial}\" cadastrado, id {result.Value.Id}. Avise o usuário que pode completar o endereço completo no cadastro do destinatário quando for usá-lo numa nota fiscal."
            : $"ERRO ao cadastrar: {result.Error.Description}. Explique o erro ao usuário e pergunte se quer tentar de novo com dados diferentes.";
    }

    private static async Task<string> CadastrarUsuarioAsync(IMediator mediator, JsonElement root, bool confirmado, Guid clienteId, CancellationToken ct)
    {
        var nome = Texto(root, "nome") ?? "";
        var email = Texto(root, "email") ?? "";

        if (!confirmado)
            return $"AINDA NÃO CRIADO — pendente de confirmação. Resumo pra mostrar ao usuário: usuário \"{nome}\" ({email}), que vai receber um e-mail de convite pra definir a própria senha. Pergunte se os dados estão corretos e se pode cadastrar; só chame a ferramenta de novo com confirmado=true depois de uma resposta afirmativa clara.";

        var result = await mediator.Send(new CreateClienteUsuarioCommand(clienteId, nome, email), ct);

        return result.IsSuccess
            ? $"CRIADO COM SUCESSO. Usuário \"{nome}\" ({email}) cadastrado, id {result.Value.Id}. Um e-mail de convite pra definir a senha foi enviado automaticamente pra ele."
            : $"ERRO ao cadastrar: {result.Error.Description}. Explique o erro ao usuário (ex.: e-mail já cadastrado) e pergunte se quer tentar de novo com dados diferentes.";
    }
}
