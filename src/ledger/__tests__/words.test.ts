import { amountInWords, toAssameseDigits } from '../words';

describe('amountInWords', () => {
  it.each([
    [0, 'Zero rupees'],
    [1, 'One rupee'],
    [7, 'Seven rupees'],
    [15, 'Fifteen rupees'],
    [20, 'Twenty rupees'],
    [45, 'Forty five rupees'],
    [100, 'One hundred rupees'],
    [120, 'One hundred twenty rupees'],
    [999, 'Nine hundred ninety nine rupees'],
    [1000, 'One thousand rupees'],
    [1200, 'One thousand two hundred rupees'],
    [10000, 'Ten thousand rupees'],
    [99999, 'Ninety nine thousand nine hundred ninety nine rupees'],
    [100000, 'One lakh rupees'],
    [150000, 'One lakh fifty thousand rupees'],
    [1234567, 'Twelve lakh thirty four thousand five hundred sixty seven rupees'],
    [10000000, 'One crore rupees'],
    [25000001, 'Two crore fifty lakh one rupees'],
  ])('%i → %s', (n, words) => {
    expect(amountInWords(n)).toBe(words);
  });
});

describe('toAssameseDigits', () => {
  it('swaps every digit and keeps separators', () => {
    expect(toAssameseDigits('₹1,200')).toBe('₹১,২০০');
    expect(toAssameseDigits('09')).toBe('০৯');
  });
});
