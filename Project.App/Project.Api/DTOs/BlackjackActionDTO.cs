using System.Text.Json;

namespace Project.Api.DTOs;

/// <summary>
/// The base class for all blackjack-specific action DTOs.
/// </summary>
public abstract record BlackjackActionDTO : GameActionDTO;

public record BetAction(long Amount) : BlackjackActionDTO;

public record HitAction : BlackjackActionDTO;

public record StandAction : BlackjackActionDTO;

public record DoubleAction : BlackjackActionDTO;

public record SplitAction(long Amount) : BlackjackActionDTO;

public record SurrenderAction : BlackjackActionDTO;

public record HurryUpAction : BlackjackActionDTO;

public static class JsonElementExtensions
{
    private static readonly JsonSerializerOptions _deserializationOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Extension method to deserialize a <see cref="BlackjackActionDTO"/> from a <see cref="JsonElement"/>.
    /// Any errors thrown during deserialization will be passed to the caller.
    /// </summary>
    public static BlackjackActionDTO ToBlackjackAction(this JsonElement element, string action)
    {
        return (
                action switch
                {
                    "bet" => element.Deserialize<BetAction>(_deserializationOptions),
                    "hit" => element.Deserialize<HitAction>(_deserializationOptions),
                    "stand" => element.Deserialize<StandAction>(_deserializationOptions),
                    "double" => element.Deserialize<DoubleAction>(_deserializationOptions),
                    "split" => element.Deserialize<SplitAction>(_deserializationOptions),
                    "surrender" => (BlackjackActionDTO?)element.Deserialize<SurrenderAction>(_deserializationOptions),
                    "hurry_up" => element.Deserialize<HurryUpAction>(_deserializationOptions),
                    _ => throw new NotSupportedException(
                        $"Action '{action}' is not a valid action for Blackjack."
                    ),
                }
            ) ?? throw new InvalidOperationException($"Could not deserialize action {action}.");
    }
}
