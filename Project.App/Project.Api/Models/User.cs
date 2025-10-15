using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Project.Api.Models
{
    public class User
    {
        [Key]
        public int Id {get; set;}
        [Required, MaxLength(50)]
        public string Name { get; set;} = null!;
        [Required, MaxLength(255)]
        public string Email {get; set;} = null!;
        [Required]
        public string PasswordHash {get; set;} = null!;
        public int Balance {get; set;} = 0;
    }
}
