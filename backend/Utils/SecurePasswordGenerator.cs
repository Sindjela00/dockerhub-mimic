using System.Security.Cryptography;

namespace backend.Utils;

public static class SecurePasswordGenerator
{
    private const string UpperCaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string LowerCaseChars = "abcdefghijkmnpqrstuvwxyz";
    private const string DigitChars = "23456789";
    private const string AllChars = UpperCaseChars + LowerCaseChars + DigitChars;

    public static string Generate(int length = 20)
    {
        if (length < 8)
        {
            throw new ArgumentOutOfRangeException(nameof(length), "Password length must be at least 8 characters.");
        }

        var passwordChars = new char[length];
        passwordChars[0] = PickRandomChar(UpperCaseChars);
        passwordChars[1] = PickRandomChar(LowerCaseChars);
        passwordChars[2] = PickRandomChar(DigitChars);

        for (var i = 3; i < length; i++)
        {
            passwordChars[i] = PickRandomChar(AllChars);
        }

        Shuffle(passwordChars);

        return new string(passwordChars);
    }

    private static char PickRandomChar(string alphabet)
        => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];

    private static void Shuffle(char[] chars)
    {
        for (var i = chars.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
    }
}
