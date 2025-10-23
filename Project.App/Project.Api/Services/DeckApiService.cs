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

    private readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    public DeckApiService(HttpClient client, IConfiguration configuration)
    {
        _httpClient = client;
        _baseApiUrl = configuration["DeckApiSettings:BaseUrl"]
            ?? "https://deckofcardsapi.com/api";
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

        // draw cards from deck
        string drawUrl = $"{_baseApiUrl}/deck/{deckId}/draw/?count={count}";
        var drawResponse = await _httpClient.GetAsync(drawUrl);
        drawResponse.EnsureSuccessStatusCode();

        var drawData = await drawResponse.Content.ReadFromJsonAsync<DrawCardsResponseDTO>(
            _jsonSerializerOptions
        );

        if (drawData?.Cards is null || drawData.Cards.Count == 0)
        {
            // shouldn't happen, but if it does, return the current hand
            return await ListHand(deckId, handName);
        }

        // get card codes (as csv string)
        var cardCodes = drawData.Cards.Select(c => c.Code);
        string cardsToAdd = string.Join(",", cardCodes);

        // add cards to the player’s hand
        await AddToHand(deckId, handName, cardsToAdd);

        // return contents of hand
        return await ListHand(deckId, handName);
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
        string addToPileUrl =
            $"{_baseApiUrl}/deck/{deckId}/pile/{handName}/add/?cards={cardCodes}";
        var addResponse = await _httpClient.GetAsync(addToPileUrl);
        if (!addResponse.IsSuccessStatusCode)
        {
            throw new HttpRequestException("Failed to return cards to deck.");
        }
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
        var listResponse = await _httpClient.GetAsync(listPileUrl);
        listResponse.EnsureSuccessStatusCode();

        var listData = await listResponse.Content.ReadFromJsonAsync<ListPilesResponseDTO>(
            _jsonSerializerOptions
        );

        List<CardDTO> cardsInHand = [];
        if (
            listData?.Piles != null // ensure piles list exists
            && listData.Piles.TryGetValue(handName, out var pile) // try to get specified pile list of piles
            && pile?.Cards != null // ensure cards list exists
        )
        {
            cardsInHand = pile.Cards;
        }

        return cardsInHand;
    }
}
