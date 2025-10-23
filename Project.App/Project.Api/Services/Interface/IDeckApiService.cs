using Project.Api.DTOs;

namespace Project.Api.Services.Interface;

public interface IDeckApiService
{
    /*
    Create a new shuffled deck and return the deck ID.
    The deck will consist of specified number of standard decks shuffled together and two Jokers if enabled.

    default values:
        numOfDecks = 6
        enableJokers = false
    */
    Task<string> CreateDeck(int numOfDecks, bool enableJokers);

    /*
    Create an empty hand (pile) identified by handName within the specified deck.
    Returns true if successful.
    */
    Task<bool> CreateEmptyHand(string deckId, long handId);

    /*
    Create an empty hand (pile) identified by handName within the specified deck.
    Returns true if successful.
    */
    Task<bool> CreateEmptyHand(string deckId, string handName);

    /*
    Player draws specified number of cards, count, from specified deck.
    Draws one card by default.
    Returns true if successful.
    */
    Task<List<CardDTO>> DrawCards(string deckId, long handId, int count);

    /*
    Player draws specified number of cards, count, from specified deck.
    Draws one card by default.
    Returns true if successful.
    */
    Task<List<CardDTO>> DrawCards(string deckId, string handName, int count);

    /*
    Return all cards from all piles back to the main deck and shuffles deck.
    Returns true if successful.
    */
    Task<bool> ReturnAllCardsToDeck(string deckId);

    /*
    Get all cards currently in a hand (pile) without drawing new ones.
    Returns list of cards in the hand.
    */
    Task<List<CardDTO>> GetHandCards(string deckId, string handName);

    /*
    Get all cards currently in a hand (pile) without drawing new ones.
    Returns list of cards in the hand.
    */
    Task<List<CardDTO>> GetHandCards(string deckId, long handId);
}
