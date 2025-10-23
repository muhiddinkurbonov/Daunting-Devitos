using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project.Api.DTOs;
using Project.Api.Models;
using Project.Api.Services.Interface;
using System.Text.Json;

namespace Project.Api.Controllers
{
    [ApiController]
    [Route("api/rooms/{roomId}/hands")]
    [Authorize] // Require authentication for all hand endpoints
    public class HandController : ControllerBase
    {
        private readonly ILogger<HandController> _logger;
        private readonly IHandService _handService;

        private readonly IDeckApiService _deckApiService;

        private readonly IMapper _mapper;

        // JSON serialization options with type discriminators for polymorphic types
        private static readonly JsonSerializerOptions _gameStateJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
            TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver()
        };

        public HandController(
            ILogger<HandController> logger,
            IHandService handService,
            IDeckApiService deckApiService,
            IMapper mapper
        )
        {
            _logger = logger;
            _handService = handService;
            _deckApiService = deckApiService;
            _mapper = mapper;
        }

        [HttpGet("", Name = "GetHandsByRoomId")]
        public async Task<IActionResult> GetHandsByRoomId(Guid roomId)
        {
            var hands = await _handService.GetHandsByRoomIdAsync(roomId);
            var handsDto = _mapper.Map<List<HandDTO>>(hands);
            return Ok(handsDto);
        }

        [HttpGet("{handId}", Name = "GetHandById")]
        public async Task<IActionResult> GetHandById(Guid roomId, Guid handId)
        {
            try
            {
                var hand = await _handService.GetHandByIdAsync(handId);
                var handDto = _mapper.Map<HandDTO>(hand);
                return Ok(handDto);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error getting hand {handId} in room {roomId}: {e.Message}");
                return NotFound(e.Message);
            }
        }

        [HttpGet("user/{userId}", Name = "GetHandsByUserId")]
        public async Task<IActionResult> GetHandsByUserId(Guid roomId, Guid userId)
        {
            try
            {
                var hands = await _handService.GetHandsByUserIdAsync(roomId, userId);
                var handsDto = _mapper.Map<List<HandDTO>>(hands);
                return Ok(handsDto);
            }
            catch (Exception e)
            {
                _logger.LogError(
                    e,
                    $"Error getting hands for user {userId} in room {roomId}: {e.Message}"
                );
                return NotFound(e.Message);
            }
        }

        [HttpGet("{handId}/cards", Name = "GetHandCards")]
        public async Task<IActionResult> GetHandCards(Guid roomId, Guid handId)
        {
            try
            {
                _logger.LogInformation($"[GetHandCards] Fetching cards for hand {handId} in room {roomId}");

                var hand = await _handService.GetHandByIdAsync(handId);
                if (hand == null)
                {
                    _logger.LogWarning($"[GetHandCards] Hand {handId} not found");
                    return NotFound("Hand not found");
                }

                var room = hand.RoomPlayer?.Room;
                if (room == null)
                {
                    _logger.LogWarning($"[GetHandCards] Room not found");
                    return BadRequest("Room not found");
                }

                // Get cards from game state instead of Deck API
                if (string.IsNullOrEmpty(room.GameState))
                {
                    _logger.LogWarning($"[GetHandCards] GameState is empty");
                    return Ok(new List<object>());
                }

                var gameState = JsonSerializer.Deserialize<Project.Api.Models.Games.BlackjackState>(room.GameState, _gameStateJsonOptions);
                if (gameState?.PlayerHands == null || !gameState.PlayerHands.ContainsKey(handId.ToString()))
                {
                    _logger.LogWarning($"[GetHandCards] No cards found for hand {handId} in game state");
                    return Ok(new List<object>());
                }

                var cards = gameState.PlayerHands[handId.ToString()];
                _logger.LogInformation($"[GetHandCards] Found {cards.Count} cards in game state");
                return Ok(cards);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Error getting cards for hand {handId}: {e.Message}");
                return StatusCode(500, e.Message);
            }
        }

        [HttpPost("", Name = "CreateHand")]
        public async Task<IActionResult> CreateHand(Guid roomId, [FromBody] HandDTO handDto)
        {
            var hand = _mapper.Map<Hand>(handDto);
            var createdHand = await _handService.CreateHandAsync(hand);
            var createdHandDto = _mapper.Map<HandDTO>(createdHand);
            return Ok(createdHandDto);
        }

        [HttpPatch("{handId}", Name = "AddCardsToHand")]
        public async Task<IActionResult> AddCardsToHand(Guid roomId, Guid handId)
        {
            try
            {
                Hand hand =
                    await _handService.GetHandByIdAsync(handId)
                    ?? throw new Exception("Hand not found");
                Room room = hand.RoomPlayer?.Room ?? throw new Exception("Room not found");
                byte[] handBytes = handId.ToByteArray();
                long result = BitConverter.ToInt64(handBytes, 0);
                List<CardDTO> drawnCards = await _deckApiService.DrawCards(room.DeckId!, result, 1);
                //send Add a card and get a List of CardDTOs
                return Ok(drawnCards);
            }
            catch (Exception e)
            {
                // throw an exception and Log it
                _logger.LogError(e, $"Error adding cards to hand {handId}: {e.Message}");
                throw new Exception(e.Message);
            }
        }

        [HttpPatch("{handId}/bet", Name = "UpdateHandBet")]
        public async Task<IActionResult> UpdateHandBet(Guid roomId, Guid handId, int newBet)
        {
            if (newBet < 0)
            {
                return BadRequest("Bet amount cannot be negative or 0");
            }
            var updatedHand = await _handService.PatchHandAsync(handId, Bet: newBet);
            var updatedHandDto = _mapper.Map<HandDTO>(updatedHand);
            return Ok(updatedHandDto);
        }

        [HttpDelete("{handId}", Name = "DeleteHand")]
        public async Task<IActionResult> DeleteHand(Guid roomId, Guid handId)
        {
            var deletedHand = await _handService.DeleteHandAsync(handId);
            var deletedHandDto = _mapper.Map<HandDTO>(deletedHand);
            return Ok(deletedHandDto);
        }
    }
}
