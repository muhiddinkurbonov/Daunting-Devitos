using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Numerics;
using Project.Api.Enum;

namespace Project.Api.Models
{
    public class RoomPlayer
    {
        [Key]
        public int Id { get; set; }

        
        [Required]
        public Guid RoomId { get; set; }
        // Navigation property for Room
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }
        
        [Required]
        public long UserId { get; set; }
        // Navigation property for User
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public Role Role { get; set; }

        public Status Status { get; set; }
        [Required]
        public BigInteger Balance { get; set; }
    }
    
}
