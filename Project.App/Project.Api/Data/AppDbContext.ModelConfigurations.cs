using Microsoft.EntityFrameworkCore;

namespace Project.Api.Data;

public partial class AppDbContext
{
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        // apply any IEntityTypeConfiguration<> implementations found in this assembly
        // fully automatic! the wonders of modern technology
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // example enum -> string conversion config
        // modelBuilder.Entity<Item>().Property(i => i.Condition).HasConversion<string>();
        // modelBuilder.Entity<Item>().Property(i => i.Availability).HasConversion<string>();
    }
}
