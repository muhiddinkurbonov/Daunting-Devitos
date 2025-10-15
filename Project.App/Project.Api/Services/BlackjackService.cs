using Project.Api.Services.Interface;

namespace Project.Api.Services;

/*

set up deck API connection
set up game configs

loop
    shuffle deck(?)

    loop
        if everyone has bet/left or time is up
            break
        end if
        wait
    end loop
    deduct bets

    deal 2 cards to each player
    deal 2 cards to dealer (one hidden)

    loop (foreach player)
        loop
            if hit
                deal card
            else if stand
                break
            end if
        end loop
    end loop

    deal to dealer (hit until 17)
    calculate scores
    determine outcomes
    distribute winnings
end loop

teardown
close room

*/

#region Blackjack Game Stages

// initial setup
// initialize deck, set game configs
public record BlackjackInitStage : BlackjackStage;

// doing pre-round setup
public record BlackjackSetupStage : BlackjackStage;

// waiting for players to bet
public record BlackjackBettingStage : BlackjackStage;

// dealing
public record BlackjackDealingStage : BlackjackStage;

// player turn
// TODO: figure out how turn order will work
public record BlackjackPlayerTurnStage(int Index) : BlackjackStage;

// dealer turn and distribute winnings
public record BlackjackDealerTurnStage : BlackjackStage;

// teardown, close room
public record BlackjackTeardownStage : BlackjackStage;

#endregion

public class BlackjackService : IBlackjackService
{
    public Task<BlackjackState> GetGamestateAsync(string gameId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> PerformActionAsync(string gameId, string playerId, string action)
    {
        throw new NotImplementedException();
    }
}
