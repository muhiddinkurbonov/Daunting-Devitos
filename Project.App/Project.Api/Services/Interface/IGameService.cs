namespace Project.Api.Services.Interface;

//
// start -> pre-game -> ||: pre-round -> | player turn (foreach player) | -> post-round :|| -> post-game
//

public enum GameStage
{
    PreGame,
    PreRound,
    PlayerTurn,
    PostRound,
    PostGame,
}

public record GameState
{
    public GameStage Stage { get; set; }
}

public interface IGameService
{
    Task<bool> DoPreGameAsync();
    Task<bool> DoPreRoundAsync();
    Task<bool> DoPlayerTurnAsync();
    Task<bool> DoPostRoundAsync();
    Task<bool> DoPostGameAsync();

    Task<GameState> GetGamestateAsync(string gameId);

    // async Task<GameState> GetGamestateAsync(string gameId)
    // {
    //     return _gameRepository.GetGamestateAsync(gameId);
    // }

    async Task<bool> DoGameActionAsync(string gameId, string playerId, string action)
    {
        GameState gamestate = await GetGamestateAsync(gameId);
        return gamestate.Stage switch
        {
            GameStage.PreGame => await DoPreGameAsync(),
            GameStage.PreRound => await DoPreRoundAsync(),
            GameStage.PlayerTurn => await DoPlayerTurnAsync(),
            GameStage.PostRound => await DoPostRoundAsync(),
            GameStage.PostGame => await DoPostGameAsync(),
            _ => throw new Exception("Unknown game stage"),
        };
    }

    // if this was not distributed, this is how it would work
    // BUT gamestate is tracked in the database, so it needs to be able to load the gamestate at any point
    // async Task MainLoopAsync()
    // {
    //     await DoPreGameAsync();

    //     // main loop
    //     bool isRunning = true;
    //     while (isRunning)
    //     {
    //         await DoPreRoundAsync();

    //         // TODO: foreach player
    //         // {
    //         //     await DoPlayerTurnAsync();
    //         // }

    //         await DoPostRoundAsync();
    //     }

    //     await DoPostGameAsync();
    // }
}
