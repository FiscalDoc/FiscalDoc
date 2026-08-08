using System.Globalization;
using System.Text.Json;
using MediatR;
using VeloXML.Application.Common;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;
using VeloXML.Application.Features.Pedidos.Queries.GetPedidos;
using VeloXML.Application.Features.Produtos.Queries.GetProdutos;
using VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarios;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Assistente.Common;

// Ferramentas de LEITURA do assistente — diferente de AssistenteAcaoExecutor, essas não mudam
// nada no sistema, então não seguem o padrão confirmar-então-executar: executam de cara e
// devolvem o resultado (ou "nada encontrado") pro modelo já usar na resposta.
internal static class AssistenteConsultaExecutor
{
    public static bool EhFerramentaDeConsulta(string nomeFerramenta) => nomeFerramenta is
        "buscar_produtos" or "buscar_destinatarios" or "buscar_usuarios" or "buscar_pedidos"
        or "top_produtos" or "top_destinatarios" or "faturamento_periodo";

    public static async Task<string> ExecutarAsync(IMediator mediator, IUnitOfWork uow, string nomeFerramenta, string argumentosJson, Guid clienteId, CancellationToken ct)
    {
        JsonElement root;
        try
        {
            using var doc = JsonDocument.Parse(argumentosJson);
            root = doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            return "ERRO: os argumentos enviados não são um JSON válido.";
        }

        return nomeFerramenta switch
        {
            "buscar_produtos" => await BuscarProdutosAsync(mediator, root, clienteId, ct),
            "buscar_destinatarios" => await BuscarDestinatariosAsync(mediator, root, clienteId, ct),
            "buscar_usuarios" => await BuscarUsuariosAsync(mediator, root, clienteId, ct),
            "buscar_pedidos" => await BuscarPedidosAsync(mediator, root, clienteId, ct),
            "top_produtos" => await TopProdutosAsync(uow, root, clienteId, ct),
            "top_destinatarios" => await TopDestinatariosAsync(uow, root, clienteId, ct),
            "faturamento_periodo" => await FaturamentoPeriodoAsync(uow, root, clienteId, ct),
            _ => "ERRO: ferramenta desconhecida.",
        };
    }

    private static string? Texto(JsonElement root, string prop) =>
        root.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.String ? el.GetString() : null;

    private static int Numero(JsonElement root, string prop, int padrao) =>
        root.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.Number ? el.GetInt32() : padrao;

    private static DateTime? Data(JsonElement root, string prop) =>
        DateTime.TryParseExact(Texto(root, prop), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            ? DateTime.SpecifyKind(d, DateTimeKind.Utc)
            : null;

    private static async Task<string> BuscarProdutosAsync(IMediator mediator, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var termo = Texto(root, "termo") ?? "";
        var result = await mediator.Send(new GetProdutosQuery(clienteId, termo, 1, 10), ct);
        if (!result.IsSuccess || result.Value.Items.Count == 0)
            return $"Nenhum produto encontrado pra \"{termo}\".";

        var linhas = result.Value.Items.Select(p => $"- id={p.Id} | código {p.Codigo} | \"{p.Descricao}\" | {p.Unidade} | preço R$ {p.PrecoUnitario:N2}");
        return $"Produtos encontrados:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> BuscarDestinatariosAsync(IMediator mediator, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var termo = Texto(root, "termo") ?? "";
        var result = await mediator.Send(new GetDestinatariosQuery(clienteId, termo, 1, 10), ct);
        if (!result.IsSuccess || result.Value.Items.Count == 0)
            return $"Nenhum destinatário encontrado pra \"{termo}\".";

        var linhas = result.Value.Items.Select(d => $"- id={d.Id} | \"{d.RazaoSocial}\"{(d.CpfCnpj is not null ? $" | CPF/CNPJ {d.CpfCnpj}" : "")}{(d.Email is not null ? $" | e-mail {d.Email}" : "")}");
        return $"Destinatários encontrados:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> BuscarUsuariosAsync(IMediator mediator, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var termo = Texto(root, "termo") ?? "";
        var result = await mediator.Send(new GetClienteUsuariosQuery(clienteId, termo, 1, 10), ct);
        if (!result.IsSuccess || result.Value.Items.Count == 0)
            return $"Nenhum usuário encontrado pra \"{termo}\".";

        var linhas = result.Value.Items.Select(u => $"- id={u.Id} | \"{u.Nome}\" | {u.Email} | {(u.Ativo ? "ativo" : "inativo")}");
        return $"Usuários encontrados:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> BuscarPedidosAsync(IMediator mediator, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var termo = Texto(root, "termo");
        var status = Texto(root, "status");
        var result = await mediator.Send(new GetPedidosQuery(clienteId, status, termo, null, null, 1, 10), ct);
        if (!result.IsSuccess || result.Value.Items.Count == 0)
            return "Nenhum pedido encontrado com esses critérios.";

        var linhas = result.Value.Items.Select(p => $"- id={p.Id} | nº {p.Numero} | \"{p.DestinatarioNome}\" | {p.Status} | R$ {p.ValorTotal:N2} | {p.CreatedAt:dd/MM/yyyy}");
        return $"Pedidos encontrados:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> TopProdutosAsync(IUnitOfWork uow, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var de = Data(root, "de");
        var ate = Data(root, "ate");
        if (de is null || ate is null) return "ERRO: informe \"de\" e \"ate\" no formato AAAA-MM-DD.";

        var limite = Numero(root, "limite", 5);
        var itens = await uow.Pedidos.GetTopProdutosAsync(clienteId, de.Value, ate.Value, limite, ct);
        if (itens.Count == 0) return $"Nenhuma venda de produto entre {de:dd/MM/yyyy} e {ate:dd/MM/yyyy}.";

        var linhas = itens.Select((p, i) => $"{i + 1}. \"{p.Descricao}\" — {p.Quantidade:N0} unidades, R$ {p.ValorTotal:N2}");
        return $"Produtos mais vendidos entre {de:dd/MM/yyyy} e {ate:dd/MM/yyyy}:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> TopDestinatariosAsync(IUnitOfWork uow, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var de = Data(root, "de");
        var ate = Data(root, "ate");
        if (de is null || ate is null) return "ERRO: informe \"de\" e \"ate\" no formato AAAA-MM-DD.";

        var limite = Numero(root, "limite", 5);
        var itens = await uow.Pedidos.GetTopDestinatariosAsync(clienteId, de.Value, ate.Value, limite, ct);
        if (itens.Count == 0) return $"Nenhum pedido entre {de:dd/MM/yyyy} e {ate:dd/MM/yyyy}.";

        var linhas = itens.Select((d, i) => $"{i + 1}. \"{d.RazaoSocial}\" — {d.QuantidadePedidos} pedido(s), R$ {d.ValorTotal:N2}");
        return $"Maiores compradores entre {de:dd/MM/yyyy} e {ate:dd/MM/yyyy}:\n{string.Join("\n", linhas)}";
    }

    private static async Task<string> FaturamentoPeriodoAsync(IUnitOfWork uow, JsonElement root, Guid clienteId, CancellationToken ct)
    {
        var de = Data(root, "de");
        var ate = Data(root, "ate");
        if (de is null || ate is null) return "ERRO: informe \"de\" e \"ate\" no formato AAAA-MM-DD.";

        var documentos = await uow.Documentos.GetByClienteAsync(clienteId, ct);
        var faturamento = documentos
            .Where(d => d.Tipo == Domain.Enums.TipoDocumentoEnum.NFe && DocumentoFaturamentoHelper.ContaComoFaturamento(d.Status)
                && d.DataEmissao >= de.Value && d.DataEmissao <= ate.Value)
            .Sum(d => d.ValorTotal);
        var quantidade = documentos.Count(d => d.Tipo == Domain.Enums.TipoDocumentoEnum.NFe && DocumentoFaturamentoHelper.ContaComoFaturamento(d.Status)
            && d.DataEmissao >= de.Value && d.DataEmissao <= ate.Value);

        return $"Faturamento entre {de:dd/MM/yyyy} e {ate:dd/MM/yyyy}: R$ {faturamento:N2}, em {quantidade} NF-e autorizada(s).";
    }
}
