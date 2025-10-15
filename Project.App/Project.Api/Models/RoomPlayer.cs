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
    public int UserId { get; set; }

    [ForeignKey("RoomId")]
    public virtual Room? Room { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    public virtual ICollection<Hand> Hands { get; set; } = [];
}
