using Project.Api.Enums;
using Project.Api.Models;
using Project.Api.Repositories;

namespace Project.Api.Repositories
{
    public interface IHandRepository
    {
        Task<Hand?> GetHandAsyncById(Guid handId);
        Task<List<Hand>> GetHandsByRoomIdAsync(Guid roomId);

        Task<Hand> CreateHandAsync(Hand hand);

        Task<Hand> UpdateHandAsync(Guid handId, Hand hand);

        Task<Hand> PatchHandAsync(Guid handId, int? Order = null, string? CardsJson = null, int? Bet = null);

        Task<Hand> DeleteHandAsync(Guid handId);

        Task SaveChangesAsync();
    }
}

