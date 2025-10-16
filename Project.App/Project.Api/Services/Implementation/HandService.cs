using Project.Api.Models;
using Project.Api.Repositories;
using Project.Api.Services;

namespace Project.Api.Services
{
    public class HandService : IHandService
    {
        private readonly IHandRepository _Repo;

        public HandService(IHandRepository repo)
        {
            _Repo = repo;
        }

        public async Task<Hand> CreateHandAsync(Hand hand)
        {
            return await _Repo.CreateHandAsync(hand);
        }
        public async Task<List<Hand>> GetHandsByRoomIdAsync(Guid roomId)
        {
            try
            {
                return await _Repo.GetHandsByRoomIdAsync(roomId);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
        }
        public async Task<Hand?> GetHandAsyncByIdAsync(Guid handId)
        {
            try
            {
                return await _Repo.GetHandAsyncById(handId);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
        }

        public async Task<List<Hand>> GetHandsByUserIdAsync(Guid roomId, Guid userId)
        {
            try
            {
                return await _Repo.GetHandsByUserIdAsync(roomId, userId);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
            
        }

        

        public async Task<Hand> UpdateHandAsync(Guid handId, Hand hand)
        {
            try
            {
                return await _Repo.UpdateHandAsync(handId, hand);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
        }

        public async Task<Hand> PatchHandAsync(Guid handId, int? Order = null, string? CardsJson = null, int? Bet = null)
        {
            try
            {
                return await _Repo.PatchHandAsync(handId, Order, CardsJson, Bet);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
        }
        public async Task<Hand> DeleteHandAsync(Guid handId)
        {
            try
            {
                return await _Repo.DeleteHandAsync(handId);
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
            
        }
        

    }
}