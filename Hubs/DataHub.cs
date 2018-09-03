using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

public class DataHub : Hub
{
    public async Task SendData(string data)
    {
        // build and send data 

        await Clients.All.SendAsync("ReceiveMessage", data);
    }

    
}