using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Project.Api.Models;

public class Hand
{
    [Key]
    public long Id { get; set; }

    public int RoomPlayerId { get; set; }

    public int Order { get; set; }

    public string CardsJson { get; set; } = string.Empty;

    public int Bet { get; set; }

    [ForeignKey("RoomPlayerId")]
    public virtual RoomPlayer? RoomPlayer { get; set; }
}
