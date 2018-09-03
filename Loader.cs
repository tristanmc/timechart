using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

public interface ILoader
{
    Task<string> Load(string data);
}

public class Loader : ILoader
{
    private readonly IHubContext<DataHub> _hub;
    
    public Loader(IHubContext<DataHub> hub)
    {
        _hub = hub;
    }

    public async Task<string> Load(string data)
    {
        await _hub.Clients.All.SendAsync("ReceiveMessage", data);

        return $"{data} more"; 
    }
}