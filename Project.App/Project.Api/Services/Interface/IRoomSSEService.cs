namespace Project.Api.Services.Interface;

public interface IRoomSSEService : IDisposable
{
    /// <summary>
    /// Adds a new client connection for a specific room and keeps it open.
    /// </summary>
    Task AddConnectionAsync(Guid roomId, HttpResponse response);

    /// <summary>
    /// Broadcasts an event to all clients connected to a specific room.
    /// </summary>
    Task BroadcastEventAsync(Guid roomId, string eventName, object data);

    /// <summary>
    /// Closes all SSE connections for graceful shutdown.
    /// </summary>
    Task CloseAllConnectionsAsync();
}
