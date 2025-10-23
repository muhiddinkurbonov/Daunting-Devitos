using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using Project.Api.Services;

namespace Project.Test.Services
{
    public class DeckApiServiceTests
    {
        private static HttpClient CreateMockHttpClient(
            string responseContent,
            HttpStatusCode statusCode = HttpStatusCode.OK
        )
        {
            var handlerMock = new Mock<HttpMessageHandler>();

            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = statusCode,
                        Content = new StringContent(responseContent),
                    }
                );

            return new HttpClient(handlerMock.Object);
        }

        [Fact]
        public async Task CreateDeck_ShouldReturnDeckId()
        {
            // Arrange
            var fakeResponse = JsonSerializer.Serialize(new { deck_id = "testdeck123" });
            var client = CreateMockHttpClient(fakeResponse);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act
            var result = await service.CreateDeck();

            // Assert
            Assert.Equal("testdeck123", result);
        }

        [Fact]
        public async Task CreateDeck_ShouldThrowException_OnFailure()
        {
            // Arrange
            var client = CreateMockHttpClient("", HttpStatusCode.BadRequest);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(() => service.CreateDeck());
        }

        [Fact]
        public async Task PlayerDraw_ShouldReturnCardList()
        {
            // Arrange
            var drawResponse =
                @"{
        ""cards"": [
            { ""code"": ""AS"", ""image"": ""url1"", ""value"": ""ACE"", ""suit"": ""SPADES"" }
        ]
    }";

            var addResponse =
                @"{
        ""success"": true
    }";

            var listResponse =
                @"{
        ""piles"": {
            ""42"": {
                ""cards"": [
                    { ""code"": ""AS"", ""image"": ""url1"", ""value"": ""ACE"", ""suit"": ""SPADES"" }
                ]
            }
        }
    }";

            var handlerMock = new Mock<HttpMessageHandler>();
            var responses = new Queue<HttpResponseMessage>(
                [
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(drawResponse),
                    },
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(addResponse),
                    },
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(listResponse),
                    },
                    // service calls list twice (listPile then listHand), return same payload again
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(listResponse),
                    },
                ]
            );

            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(responses.Dequeue);

            var client = new HttpClient(handlerMock.Object);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act
            var result = await service.DrawCards("deck123", 42);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("AS", result[0].Code);
            Assert.Equal("ACE", result[0].Value);
            Assert.Equal("SPADES", result[0].Suit);
            Assert.Equal("url1", result[0].Image);
        }

        [Fact]
        public async Task ReturnAllCardsToDeck_ShouldReturnTrue()
        {
            // Arrange
            var client = CreateMockHttpClient("{}", HttpStatusCode.OK);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act
            var result = await service.ReturnAllCardsToDeck("deck123");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CreateEmptyHand_ShouldReturnTrue_OnSuccess()
        {
            // Arrange
            var client = CreateMockHttpClient("{\"success\": true}", HttpStatusCode.OK);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act
            var result = await service.CreateEmptyHand("deck123", 7);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CreateEmptyHand_ShouldThrow_OnFailure()
        {
            // Arrange
            var client = CreateMockHttpClient("", HttpStatusCode.InternalServerError);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(() =>
                service.CreateEmptyHand("deck123", 7)
            );
        }

        [Fact]
        public async Task ReturnAllCardsToDeck_ShouldThrow_OnFailure()
        {
            // Arrange
            var client = CreateMockHttpClient("", HttpStatusCode.BadRequest);
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["DeckApiSettings:BaseUrl"]).Returns("https://deckofcardsapi.com/api");
            var service = new DeckApiService(client, configMock.Object);

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(() =>
                service.ReturnAllCardsToDeck("deck123")
            );
        }
    }
}
