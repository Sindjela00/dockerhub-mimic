using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin/logs")]
[Authorize(Roles = "Administrator,SuperAdmin")]
public class LogsController : ControllerBase
{
    private readonly ILogSearchService _logSearchService;

    public LogsController(ILogSearchService logSearchService)
    {
        _logSearchService = logSearchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? query,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var effectivePage = page <= 0 ? 1 : page;
        var effectivePageSize = pageSize <= 0 ? 25 : pageSize;

        var result = await _logSearchService.SearchAsync(query, from, to, effectivePage, effectivePageSize, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { total = result.Total, entries = result.Entries });
    }
}
