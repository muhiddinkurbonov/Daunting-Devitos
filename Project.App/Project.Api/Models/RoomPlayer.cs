namespace Project.Api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class RoomPlayer
{
    [Key]
    public long Id { get; set; }
    [Required]
    public Guid RoomId { get; set; }
    [Required]
    public long UserId { get; set; }
    [Required]
    public PlayerRole Role { get; set; }
}
