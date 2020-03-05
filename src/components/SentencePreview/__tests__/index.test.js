import { chunkSentence } from '..';


describe('chunkSentence', () => {
  test('chunk with spaces', () => {
    const sentence = 'Craft beer knausgaard schlitz skateboard offal fingerstache';
    const words = ['beer knausgaard'];
    expect(chunkSentence(sentence, words)).toEqual(['Craft ', 'beer knausgaard', ' schlitz skateboard offal fingerstache']);
  });

  test('chunk without spaces', () => {
    const sentence = 'Craft beer knausgaard schlitz skateboard offal fingerstache';
    const words = ['beer'];
    expect(chunkSentence(sentence, words)).toEqual(['Craft ', 'beer', ' knausgaard schlitz skateboard offal fingerstache']);
  });

  test('chunks for multiple words', () => {
    const sentence = 'Craft beer knausgaard schlitz skateboard offal fingerstache';
    const words = ['beer', 'schlitz'];
    expect(chunkSentence(sentence, words)).toEqual(['Craft ', 'beer', ' knausgaard ', 'schlitz', ' skateboard offal fingerstache']);
  });
});
