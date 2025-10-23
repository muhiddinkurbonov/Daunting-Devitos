using System.Text.Json;
using System.Text.Json.Serialization;
using Project.Api.DTOs;
using Project.Api.Services.Interface;
using Project.Api.Utilities;

namespace Project.Api.Services;

public class DeckApiService : IDeckApiService
{
    private readonly HttpClient _httpClient;
    private readonly string _baseApiUrl;
    private readonly ILogger<DeckApiService> _logger;

    private readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    public DeckApiService(HttpClient client, IConfiguration configuration, ILogger<DeckApiService> logger)
    {
        _httpClient = client;
        _baseApiUrl = configuration["DeckApiSettings:BaseUrl"] ?? "https://deckofcardsapi.com/api";
        _logger = logger;
    }

    /// <summary>
    /// Create a new shuffled deck and return the deck ID.
    /// The deck will consist of specified number of standard decks shuffled together and two Jokers if enabled.
    /// default values:
    ///     numOfDecks = 6
    ///     enableJokers = false
    /// </summary>
    /// <returns>The deck ID of the created deck</returns>
    public async Task<string> CreateDeck(int numOfDecks = 6, bool enableJokers = false)
    {
        string url =
            $"{_baseApiUrl}/deck/new/shuffle/?deck_count={numOfDecks}&enable_Jokers={enableJokers}";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Failed to create deck.");
        }

        var createDeckResponse = await response.Content.ReadFromJsonAsync<CreateDeckResponseDTO>(
            _jsonSerializerOptions
        );

        return createDeckResponse?.DeckId ?? throw new HttpRequestException("Deck ID not found.");
    }

    /// <summary>
    /// Create an empty hand (pile) identified by handName within the specified deck.
    /// </summary>
    /// <returns>true if successful</returns>
    public async Task<bool> CreateEmptyHand(string deckId, string handName)
    {
        string url = $"{_baseApiUrl}/deck/{deckId}/pile/{handName}/add/?cards=";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Failed to create empty hand.");
        }

        return true;
    }

    /// <summary>
    /// Create an empty hand (pile) identified by handName within the specified deck.
    /// </summary>
    /// <returns>true if successful</returns>
    public async Task<bool> CreateEmptyHand(string deckId, long handId)
    {
        return await CreateEmptyHand(deckId, handId.ToString());
    }

    /// <summary>
    /// Player draws specified number of cards, count, from specified deck.
    /// Draws one card by default.
    /// </summary>
    /// <returns>true if successful</returns>
    public async Task<List<CardDTO>> DrawCards(string deckId, long handId, int count = 1)
    {
        return await DrawCards(deckId, handId.ToString(), count);
    }

    /// <summary>
    /// Player draws specified number of cards, count, from specified deck.
    /// Draws one card by default.
    /// </summary>
    /// <returns>true if successful</returns>
    public async Task<List<CardDTO>> DrawCards(string deckId, string handName, int count = 1)
    {
        // enforce non-negative count
        if (count < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count), "Count must be non-negative");
        }

        _logger.LogWarning($"[DrawCards] Drawing {count} cards for pile '{handName}' from deck {deckId}");

        // Draw cards from deck
        string drawUrl = $"{_baseApiUrl}/deck/{deckId}/draw/?count={count}";
        var drawResponse = await _httpClient.GetAsync(drawUrl);
        drawResponse.EnsureSuccessStatusCode();

        var drawData = await drawResponse.Content.ReadFromJsonAsync<DrawCardsResponseDTO>(
            _jsonSerializerOptions
        );

        _logger.LogWarning($"[DrawCards] Drew {drawData?.Cards?.Count ?? 0} cards from deck");

        if (drawData?.Cards is null || drawData.Cards.Count == 0)
        {
            _logger.LogError($"[DrawCards] No cards drawn from deck!");
            return new List<CardDTO>();
        }

        // Return the drawn cards directly - don't try to add to pile
        // The pile concept in Deck API is broken, so we'll just return the cards
        _logger.LogWarning($"[DrawCards] Returning {drawData.Cards.Count} cards: {string.Join(", ", drawData.Cards.Select(c => c.Code))}");
        return drawData.Cards;
    }

    /// <summary>
    /// Return all cards from all piles back to the main deck.
    /// </summary>
    /// <returns>true if successful</returns>
    public async Task<bool> ReturnAllCardsToDeck(string deckId)
    {
        string url = $"{_baseApiUrl}/deck/{deckId}/return/";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Failed to return cards to deck.");
        }
        return true;
    }

    /// <summary>
    /// Calls Api to add card to specified hand. If hand does not exist, will create a hand with give handName.
    /// </summary>
    /// <returns>true if successful</returns>
    private async Task<bool> AddToHand(string deckId, string handName, string cardCodes)
    {
        string addToPileUrl = $"{_baseApiUrl}/deck/{deckId}/pile/{handName}/add/?cards={cardCodes}";
        _logger.LogWarning($"[AddToHand] URL: {addToPileUrl}");
        var addResponse = await _httpClient.GetAsync(addToPileUrl);
        if (!addResponse.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Failed to return cards to deck.");
        }
        var responseContent = await addResponse.Content.ReadAsStringAsync();
        _logger.LogWarning($"[AddToHand] Response: {responseContent}");
        return true;
    }

    /// <summary>
    /// Get all cards currently in a hand (pile) without drawing new ones.
    /// </summary>
    public async Task<List<CardDTO>> GetHandCards(string deckId, string handName)
    {
        return await ListHand(deckId, handName);
    }

    /// <summary>
    /// Get all cards currently in a hand (pile) without drawing new ones.
    /// </summary>
    public async Task<List<CardDTO>> GetHandCards(string deckId, long handId)
    {
        return await ListHand(deckId, handId.ToString());
    }

    /// <summary>
    /// Calls Api to list cards in specified pile from specified deck.
    /// </summary>
    /// <returns>A list of card DTOs</returns>
    private async Task<List<CardDTO>> ListHand(string deckId, string handName)
    {
        string listPileUrl = $"{_baseApiUrl}/deck/{deckId}/pile/{handName}/list/";
        _logger.LogWarning($"[ListHand] URL: {listPileUrl}");
        var listResponse = await _httpClient.GetAsync(listPileUrl);
        listResponse.EnsureSuccessStatusCode();

        var responseContent = await listResponse.Content.ReadAsStringAsync();
        _logger.LogWarning($"[ListHand] Response: {responseContent}");

        var listData = await listResponse.Content.ReadFromJsonAsync<ListPilesResponseDTO>(
            _jsonSerializerOptions
        );

        _logger.LogWarning($"[ListHand] Piles in response: {listData?.Piles?.Count ?? 0}");
        if (listData?.Piles != null)
        {
            foreach (var pileName in listData.Piles.Keys)
            {
                _logger.LogWarning($"[ListHand] Pile found: '{pileName}', Cards: {listData.Piles[pileName]?.Cards?.Count ?? 0}");
            }
        }

        List<CardDTO> cardsInHand = [];
        if (
            listData?.Piles != null // ensure piles list exists
            && listData.Piles.TryGetValue(handName, out var pile) // try to get specified pile list of piles
            && pile?.Cards != null // ensure cards list exists
        )
        {
            cardsInHand = pile.Cards;
        }
        else
        {
            _logger.LogError($"[ListHand] Could not find pile '{handName}' in response!");
        }

        return cardsInHand;
    }
}
