using CardDeck.Test;
using FluentAssertions;

[assembly: FluentAssertions.Extensibility.AssertionEngineInitializer(
    typeof(AssertionEngineInitializer),
    nameof(AssertionEngineInitializer.AcknowledgeSoftWarning)
)]

namespace CardDeck.Test;

public static class AssertionEngineInitializer
{
    public static void AcknowledgeSoftWarning()
    {
        License.Accepted = true;
    }
}
