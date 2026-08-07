using System.Text.Json;
using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioById;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Application.Features.Produtos.Queries.GetProdutoById;
using VeloXML.Application.Features.Produtos.Queries.GetProdutos;
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
            "cadastrar_pedido" => await CadastrarPedidoAsync(mediator, root, confirmado, clienteId, ct),
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

        // Checagem de duplicidade antes de tudo — inclusive antes do resumo de confirmação, pra
        // já avisar o usuário de cara em vez de pedir confirmação de um cadastro que vai falhar
        // (ou pior, criar um duplicado, já que CreateProdutoCommand não valida unicidade).
        var existente = await BuscarProdutoPorCodigoAsync(mediator, clienteId, codigo, ct);
        if (existente is not null)
            return $"JÁ EXISTE — não cadastre de novo. Já existe um produto com o código \"{codigo}\" (\"{existente.Descricao}\", preço atual R$ {existente.PrecoUnitario:N2}). Avise o usuário disso; se ele quiser alterar o preço ou outro dado, oriente a editar o produto existente na tela de Cadastros, não peça pra cadastrar de novo.";

        if (!confirmado)
            return $"AINDA NÃO CRIADO — pendente de confirmação. Resumo pra mostrar ao usuário: produto \"{descricao}\" (código {codigo}), unidade {unidade}, preço unitário R$ {preco:N2}. Pergunte se os dados estão corretos e se pode cadastrar; só chame a ferramenta de novo com confirmado=true depois de uma resposta afirmativa clara.";

        // Re-checa logo antes de criar — cobre o caso de duas chamadas da ferramenta em paralelo
        // (ou o usuário confirmando duas vezes seguidas) criarem o mesmo produto na janela entre
        // a checagem acima e o create.
        if (await BuscarProdutoPorCodigoAsync(mediator, clienteId, codigo, ct) is not null)
            return $"JÁ EXISTE — não cadastre de novo. Um produto com o código \"{codigo}\" acabou de ser cadastrado (provavelmente por essa mesma conversa). Avise o usuário que já está cadastrado, sem repetir a criação.";

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

        // Mesma lógica de duplicidade do produto — CreateDestinatarioCommand também não valida
        // unicidade. Prioriza CPF/CNPJ (identificador real) quando informado; sem ele, cai pra
        // razão social exata.
        var existenteDest = await BuscarDestinatarioAsync(mediator, clienteId, cpfCnpj, razaoSocial, ct);
        if (existenteDest is not null)
            return $"JÁ EXISTE — não cadastre de novo. Já existe um destinatário \"{existenteDest.RazaoSocial}\"{(existenteDest.CpfCnpj is not null ? $" (CPF/CNPJ {existenteDest.CpfCnpj})" : "")} cadastrado. Avise o usuário disso; se ele quiser alterar algum dado, oriente a editar o destinatário existente na tela de Cadastros, não peça pra cadastrar de novo.";

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

        if (await BuscarDestinatarioAsync(mediator, clienteId, cpfCnpj, razaoSocial, ct) is not null)
            return $"JÁ EXISTE — não cadastre de novo. Um destinatário \"{razaoSocial}\" acabou de ser cadastrado (provavelmente por essa mesma conversa). Avise o usuário que já está cadastrado, sem repetir a criação.";

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
        // Cadastro de usuário já é protegido contra duplicidade pelo próprio CreateUsuarioCommand
        // (checa e-mail existente e devolve ResultError.Conflict), não precisa de checagem extra aqui.
    }

    private static async Task<string> CadastrarPedidoAsync(IMediator mediator, JsonElement root, bool confirmado, Guid clienteId, CancellationToken ct)
    {
        if (!root.TryGetProperty("destinatarioId", out var destIdEl) || !Guid.TryParse(destIdEl.GetString(), out var destinatarioId))
            return "ERRO: destinatarioId inválido ou ausente. Use buscar_destinatarios pra achar o id certo antes de chamar de novo.";

        if (!root.TryGetProperty("itens", out var itensEl) || itensEl.ValueKind != JsonValueKind.Array || itensEl.GetArrayLength() == 0)
            return "ERRO: informe ao menos um item (produtoId + quantidade). Use buscar_produtos pra achar os ids certos antes de chamar de novo.";

        var destResult = await mediator.Send(new GetDestinatarioByIdQuery(destinatarioId, clienteId), ct);
        if (!destResult.IsSuccess)
            return $"ERRO: destinatário não encontrado ({destResult.Error.Description}). Use buscar_destinatarios pra confirmar o id certo.";

        var itensParseados = new List<(Guid ProdutoId, decimal Quantidade, decimal? PrecoUnitario, decimal Desconto)>();
        foreach (var itemEl in itensEl.EnumerateArray())
        {
            if (!itemEl.TryGetProperty("produtoId", out var pIdEl) || !Guid.TryParse(pIdEl.GetString(), out var produtoId))
                return "ERRO: um dos itens tem produtoId inválido ou ausente. Use buscar_produtos pra achar os ids certos.";

            var quantidade = itemEl.TryGetProperty("quantidade", out var qEl) && qEl.ValueKind == JsonValueKind.Number ? qEl.GetDecimal() : 0m;
            if (quantidade <= 0)
                return "ERRO: a quantidade de um dos itens precisa ser maior que zero.";

            var precoUnitario = itemEl.TryGetProperty("precoUnitario", out var precoEl) && precoEl.ValueKind == JsonValueKind.Number ? (decimal?)precoEl.GetDecimal() : null;
            var desconto = itemEl.TryGetProperty("desconto", out var descEl) && descEl.ValueKind == JsonValueKind.Number ? descEl.GetDecimal() : 0m;

            itensParseados.Add((produtoId, quantidade, precoUnitario, desconto));
        }

        var produtos = new List<ProdutoDto>();
        foreach (var item in itensParseados)
        {
            var produtoResult = await mediator.Send(new GetProdutoByIdQuery(item.ProdutoId, clienteId), ct);
            if (!produtoResult.IsSuccess)
                return $"ERRO: produto {item.ProdutoId} não encontrado ({produtoResult.Error.Description}). Use buscar_produtos pra confirmar os ids certos.";
            produtos.Add(produtoResult.Value);
        }

        var naturezaOperacao = Texto(root, "naturezaOperacao") ?? "Venda de mercadoria";
        var observacoes = Texto(root, "observacoes");

        // Sempre parte do cadastro ATUAL do produto pra descrição/unidade/dados fiscais — só o
        // preço e o desconto podem vir sobrescritos pela ferramenta, o resto vem do produto real
        // pra não deixar a nota sair com NCM/CFOP/CST em branco.
        var itensCommand = itensParseados.Zip(produtos, (item, produto) => new CreatePedidoItemInput(
            produto.Id, produto.Descricao, produto.Unidade, item.Quantidade, item.PrecoUnitario ?? produto.PrecoUnitario, item.Desconto,
            produto.Cfop, produto.Ncm, produto.AliquotaIcms, produto.AliquotaPis, produto.AliquotaCofins,
            produto.CstIcms, produto.CstPis, produto.CstCofins, produto.IcmsOrigem, produto.IbsCbsCst, produto.IbsCbsClassificacaoTributaria)
        ).ToList();

        var valorTotal = itensCommand.Sum(i => Math.Max(0, (i.Quantidade * i.PrecoUnitario) - i.Desconto));

        if (!confirmado)
        {
            var resumoItens = string.Join("; ", itensCommand.Select(i => $"{i.Quantidade}x \"{i.Descricao}\" a R$ {i.PrecoUnitario:N2}"));
            return $"AINDA NÃO CRIADO — pendente de confirmação. Resumo pra mostrar ao usuário: pedido pra \"{destResult.Value.RazaoSocial}\", itens: {resumoItens}, total R$ {valorTotal:N2}. Pergunte se os dados estão corretos e se pode cadastrar; só chame a ferramenta de novo com confirmado=true depois de uma resposta afirmativa clara.";
        }

        var result = await mediator.Send(new CreatePedidoCommand(
            clienteId, destinatarioId, observacoes, itensCommand, naturezaOperacao, null, null, null, null), ct);

        return result.IsSuccess
            ? $"CRIADO COM SUCESSO. Pedido nº {result.Value.Numero} pra \"{destResult.Value.RazaoSocial}\" criado como rascunho, total R$ {result.Value.ValorTotal:N2}, id {result.Value.Id}. Avise o usuário que o pedido está em rascunho e ele pode revisar e emitir a NF-e na tela de Pedidos quando quiser."
            : $"ERRO ao cadastrar: {result.Error.Description}. Explique o erro ao usuário e pergunte se quer tentar de novo.";
    }

    private static async Task<ProdutoDto?> BuscarProdutoPorCodigoAsync(IMediator mediator, Guid clienteId, string codigo, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(codigo)) return null;

        var result = await mediator.Send(new GetProdutosQuery(clienteId, codigo, 1, 20), ct);
        return result.IsSuccess
            ? result.Value.Items.FirstOrDefault(p => string.Equals(p.Codigo, codigo, StringComparison.OrdinalIgnoreCase))
            : null;
    }

    private static async Task<DestinatarioDto?> BuscarDestinatarioAsync(IMediator mediator, Guid clienteId, string? cpfCnpj, string razaoSocial, CancellationToken ct)
    {
        var termo = !string.IsNullOrWhiteSpace(cpfCnpj) ? cpfCnpj : razaoSocial;
        if (string.IsNullOrWhiteSpace(termo)) return null;

        var result = await mediator.Send(new GetDestinatariosQuery(clienteId, termo, 1, 20), ct);
        if (!result.IsSuccess) return null;

        return !string.IsNullOrWhiteSpace(cpfCnpj)
            ? result.Value.Items.FirstOrDefault(d => d.CpfCnpj is not null && SoDigitos(d.CpfCnpj) == SoDigitos(cpfCnpj))
            : result.Value.Items.FirstOrDefault(d => string.Equals(d.RazaoSocial, razaoSocial, StringComparison.OrdinalIgnoreCase));
    }

    private static string SoDigitos(string s) => new(s.Where(char.IsDigit).ToArray());
}
