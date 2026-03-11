using backend.Controllers;

namespace backend.Tests;

[TestClass]
public sealed class WeatherForecastControllerTests
{
    [TestMethod]
    public void Get_ReturnsFiveForecasts()
    {
        var controller = new WeatherForecastController();

        var result = controller.Get().ToArray();

        Assert.AreEqual(5, result.Length);
    }

    [TestMethod]
    public void Get_ReturnsForecastsWithAscendingDates()
    {
        var controller = new WeatherForecastController();

        var result = controller.Get().ToArray();

        for (var index = 1; index < result.Length; index++)
        {
            Assert.IsTrue(result[index].Date > result[index - 1].Date);
        }
    }

    [TestMethod]
    public void Get_ReturnsForecastsWithValidValues()
    {
        var controller = new WeatherForecastController();

        var result = controller.Get().ToArray();

        foreach (var forecast in result)
        {
            Assert.IsTrue(forecast.TemperatureC >= -20 && forecast.TemperatureC < 55);
            Assert.IsFalse(string.IsNullOrWhiteSpace(forecast.Summary));
        }
    }

    [TestMethod]
    public void TemperatureF_ComputesExpectedValue()
    {
        var model = new WeatherForecast
        {
            TemperatureC = 10
        };

        Assert.AreEqual(49, model.TemperatureF);
    }
}
