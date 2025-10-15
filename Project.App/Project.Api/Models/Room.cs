namespace Project.Api.Models;
using System.ComponentModel.DataAnnotations;

public class Room
{
    [Key] public Guid Id {get; set;}

    public long HostId {get;set;}
    public User Host { get; set; } = null!;




}