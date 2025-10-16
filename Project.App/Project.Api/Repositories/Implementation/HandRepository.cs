using Project.Api.Enums;
using Project.Api.Models;
using Project.Api.Repositories;
using Project.Api.Data;
using Microsoft.EntityFrameworkCore;


namespace Project.Api.Repositories
{
    public class HandRepository : IHandRepository
    {
        private readonly AppDbContext _context;

        public HandRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Hand?> GetHandAsyncById(Guid handId)
        {
            return await _context.Hands.FirstOrDefaultAsync(h => h.Id == handId);
        }
        public async Task<List<Hand>> GetHandsByRoomIdAsync(Guid roomId)
        {
            if (roomId == Guid.Empty)
            {
                throw new ArgumentException("Invalid roomId");
            }
            return await _context.Hands
                .Include(h => h.RoomPlayer)
                .Where(h => h.RoomPlayer != null && h.RoomPlayer.RoomId == roomId)
                .ToListAsync();
        }
        public async Task<Hand> CreateHandAsync(Hand hand)
        {
            if (hand == null)
            {
                throw new ArgumentNullException("Hand cannot be null");
            }

            await _context.Hands.AddAsync(hand);
            await SaveChangesAsync();

            return hand;
        }
        public async Task<Hand> UpdateHandAsync(Guid handId, Hand hand)
        {
            var existingHand = await _context.Hands.FindAsync(handId);
            if (existingHand == null)
            {
                throw new KeyNotFoundException("Hand not found");
            }

            // Update properties
            existingHand.Order = hand.Order;
            existingHand.CardsJson = hand.CardsJson;
            existingHand.Bet = hand.Bet;

            _context.Hands.Update(existingHand);
            await SaveChangesAsync();

            return existingHand;
        }

        public async Task<Hand> PatchHandAsync(Guid handId, int? Order = null, string? CardsJson = null, int? Bet = null)
        {
            var existingHand = await _context.Hands.FindAsync(handId);
            if (existingHand == null)
            {
                throw new KeyNotFoundException("Hand not found");
            }

            // Update properties if provided
            existingHand.Order = Order.HasValue ? Order.Value : existingHand.Order;

            existingHand.CardsJson = CardsJson != null ? CardsJson : existingHand.CardsJson;

            existingHand.Bet = Bet.HasValue ? Bet.Value : existingHand.Bet;

            _context.Hands.Update(existingHand);
            await SaveChangesAsync();

            return existingHand;
        }

        public async Task<Hand> DeleteHandAsync(Guid handId)
        {
            var existingHand = await _context.Hands.FindAsync(handId);
            if (existingHand == null)
            {
                throw new KeyNotFoundException("Hand not found");
            }

            _context.Hands.Remove(existingHand);
            await SaveChangesAsync();

            return existingHand;
        }
        
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

    }
}