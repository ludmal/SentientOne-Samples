using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("sentientone", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>().GetSection("SentientOne");
    client.BaseAddress = new Uri(cfg["BaseUrl"]!);
    client.DefaultRequestHeaders.Add("X-Api-Key", cfg["ApiKey"]);
    client.DefaultRequestHeaders.Add("X-Agent-Id", cfg["AgentId"]);
    client.Timeout = TimeSpan.FromMinutes(5);
});

var app = builder.Build();

app.MapGet("/", () => Results.Text(
    "SentientOne sample. Try: GET /chat?message=Hello! Can you introduce yourself?"));

app.MapGet("/chat", async (
    string? message,
    IHttpClientFactory httpFactory,
    HttpContext ctx,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(message))
    {
        return Results.BadRequest(new { error = "Query string 'message' is required." });
    }

    var http = httpFactory.CreateClient("sentientone");

    var payload = JsonSerializer.Serialize(new { message });
    using var req = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/stream")
    {
        Content = new StringContent(payload, Encoding.UTF8, "application/json")
    };

    using var upstream = await http.SendAsync(
        req, HttpCompletionOption.ResponseHeadersRead, ct);

    ctx.Response.StatusCode = (int)upstream.StatusCode;
    ctx.Response.ContentType = upstream.Content.Headers.ContentType?.ToString()
        ?? "text/event-stream";

    await using var src = await upstream.Content.ReadAsStreamAsync(ct);
    await src.CopyToAsync(ctx.Response.Body, ct);

    return Results.Empty;
});

app.Run();
