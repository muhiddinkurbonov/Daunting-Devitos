namespace Project.Api.DTOs
{
    public class HandDTO
    {
        public Guid Id { get; set; }

        public Guid RoomPlayerId { get; set; }

        public int Order { get; set; }

        public string CardsJson { get; set; } = string.Empty;

        public int Bet { get; set; }
    }
}
