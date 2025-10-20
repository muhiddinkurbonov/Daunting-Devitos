using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Project.Api.Models;
using Project.Api.Repositories;
using Project.Api.Services;
using Project.Api.Controllers;
using Project.Api.DTOs;
using Xunit;

namespace Project.Test.Controllers
{
    public class HandControllerTest
    {
        private readonly Mock<IHandService> _mockHandService;
        private readonly Mock<IMapper> _mockMapper;

        private HandController _controller;


        public HandControllerTest()
        {
            _mockHandService = new Mock<IHandService>();
            _mockMapper = new Mock<IMapper>();
            _controller = new HandController(
                Mock.Of<ILogger<HandController>>(),
                _mockHandService.Object,
                _mockMapper.Object
            );
        }

        [Fact]
        public async Task GetHandsByRoomId_ReturnsOkResult_WithListOfHandDTOs()
        {
            //Arrange
            var roomId = Guid.NewGuid();
            var handId = Guid.NewGuid();
            var handModels = new List<Hand>
            {
                new () {
                    Id = handId,
                    RoomPlayerId = Guid.NewGuid(),
                    Order = 1,
                    CardsJson = "[]",
                    Bet = 100,
                },
                new () {
                    Id = Guid.NewGuid(),
                    RoomPlayerId = Guid.NewGuid(),
                    Order = 2,
                    CardsJson = "[]",
                    Bet = 200,
                },
                // Add more Hand objects if needed
            };

            var handDTOs = handModels.Select(h => new HandDTO
            {
                Id = h.Id,
                RoomPlayerId = h.RoomPlayerId,
                Order = h.Order,
                CardsJson = h.CardsJson,
                Bet = h.Bet
            }).ToList();

            _mockHandService.Setup(service => service.GetHandsByRoomIdAsync(roomId)).ReturnsAsync(handModels);
            _mockMapper.Setup(m => m.Map<List<HandDTO>>(It.IsAny<List<Hand>>())).Returns(handDTOs);

            //Act

            var result = await _controller.GetHandsByRoomId(roomId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsAssignableFrom<List<HandDTO>>(okResult.Value);
            Assert.Equal(handDTOs.Count, returnValue.Count);

            _mockHandService.Verify(service => service.GetHandsByRoomIdAsync(roomId), Times.Once);
        }
        
    }
}