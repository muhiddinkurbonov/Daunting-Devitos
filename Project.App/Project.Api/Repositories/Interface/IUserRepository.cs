using Project.Api.Models;

namespace Project.Api.Repositories
{
    public interface IUserRepository
    {
        public interface IUserRepository
        {
            Task<IEnumerable<User>> GetAllAsync();
            Task<User?> GetByIdAsync(int id);
            Task<User?> GetByEmailAsync(string email);
            Task AddAsync(User user);
            Task UpdateAsync(User user);
            Task DeleteAsync(int id);
            Task SaveChangesAsync();
        }

        // implementation

        public class UserRepository : IUserRepository
        {
            private readonly AppDbContext _context;   // rename AppDbContext later 

            public UserRepository(AppDbContext context)
            {
                _context = context;
            }

            // Get all users
            public async Task<IEnumerable<User>> GetAllAsync()
            {
                return await _context.Users.ToListAsync();
            }

            //  Get user by ID
            public async Task<User?> GetByIdAsync(int id)
            {
                return await _context.Users.FindAsync(id);
            }

            //  Get user by email
            public async Task<User?> GetByEmailAsync(string email)
            {
                return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            }

            // Add new user
            public async Task AddAsync(User user)
            {
                await _context.Users.AddAsync(user);
            }

            // Update existing user
            public async Task UpdateAsync(User user)
            {
                _context.Users.Update(user);
            }

            // Delete user by ID
            public async Task DeleteAsync(int id)
            {
                var user = await _context.Users.FindAsync(id);
                if (user != null)
                {
                    _context.Users.Remove(user);
                }
            }

            //  Save changes
            public async Task SaveChangesAsync()
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}