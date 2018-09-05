using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace temporalchart
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSignalR();

            services.AddSingleton(typeof(ILoader), typeof(Loader));
            services.AddSingleton(typeof(IAnalyser), typeof(Analyser));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseFileServer();

            app.UseSignalR(routes =>
            {
                routes.MapHub<DataHub>("/dataHub");
            });

            app.Run(async (context) =>
            {
                var input =  await new StreamReader(context.Request.Body).ReadToEndAsync();
                var loader = context.RequestServices.GetService<ILoader>();
                await loader.Load(input);

                var analyser = context.RequestServices.GetService<IAnalyser>();
                var res = analyser.GetSentiment("It was a bad day");

                await context.Response.WriteAsync(res.ToString());
            });
        }
    }
}
