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

  test('chunks, ignore subchunks of subchunks', () => {
    const sentence = 'Craft beer knausgaard schlitz skateboard offal fingerstache';
    const words = ['beer knausgaard', 'knaus', 'gaard', 'skateboard'];
    expect(chunkSentence(sentence, words)).toEqual(['Craft ', 'beer knausgaard', ' schlitz ', 'skateboard', ' offal fingerstache']);
  });

  test('chunks subchunks smaller first', () => {
    const sentence = 'knaus Craft beer knausgaard schlitz skateboard offal fingerstache';
    const words = ['beer knausgaard', 'knaus', 'gaard', 'skateboard'];
    expect(chunkSentence(sentence, words)).toEqual([
      'knaus', ' Craft ', 'beer knausgaard', ' schlitz ', 'skateboard', ' offal fingerstache',
    ]);
  });

  test('chunks subchunks smaller last', () => {
    const sentence = 'Craft beer knausgaard schlitz knaus skateboard offal fingerstache';
    const words = ['beer knausgaard', 'knaus', 'gaard', 'skateboard'];
    expect(chunkSentence(sentence, words)).toEqual([
      'Craft ', 'beer knausgaard', ' schlitz ', 'knaus', ' ', 'skateboard', ' offal fingerstache',
    ]);
  });
});
