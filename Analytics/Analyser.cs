using System.Threading;
using System.Threading.Tasks;
using Microsoft.Rest;
using System.Net.Http;
using Microsoft.Azure.CognitiveServices.Language.TextAnalytics;
using Microsoft.Azure.CognitiveServices.Language.TextAnalytics.Models;
using System.Collections.Generic;
using System.Linq;

public class Creds : ServiceClientCredentials
{
    public override Task ProcessHttpRequestAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.Add("Ocp-Apim-Subscription-Key", "d935cd5d34c74719ad5b384e6206a431");
        return base.ProcessHttpRequestAsync(request, cancellationToken);
    }
}

public interface IAnalyser
{
    double GetSentiment(string phrase);
}

public class Analyser : IAnalyser
{
    private readonly TextAnalyticsAPI _client;
    public Analyser()
    {
        _client = new TextAnalyticsAPI(new Creds())
        {
            AzureRegion = AzureRegions.Australiaeast
        };
    }

    public double GetSentiment(string phrase)
    {
        // Extracting sentiment.
        SentimentBatchResult result = _client.SentimentAsync(
                new MultiLanguageBatchInput(
                    new List<MultiLanguageInput>()
                    {
                        new MultiLanguageInput("en", "0", phrase)
                    })).Result;


        // Printing sentiment results.
        return result.Documents.FirstOrDefault()?.Score ?? 0.5;
    }
}