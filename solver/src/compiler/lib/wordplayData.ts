export interface WordplayCategory {
  id: string;
  name: string;
  description: string;
  indicators: string[];
}

export interface Abbreviation {
  abbr: string;
  meanings: string[];
}

export const WORDPLAY_CATEGORIES: WordplayCategory[] = [
  {
    id: 'anagram',
    name: 'Anagram',
    description: 'Signal that the letters of a word or phrase are rearranged.',
    indicators: [
      'about', 'absurd', 'active', 'adjusted', 'affected', 'agitated', 'all over the place',
      'altered', 'amended', 'anew', 'arranged', 'askew', 'awful', 'badly', 'battered',
      'bizarre', 'blended', 'broken', 'broken up', 'bustling', 'changed', 'chaotic',
      'chopped', 'churned', 'complex', 'complicated', 'confused', 'convoluted', 'converted',
      'corrupt', 'crazy', 'crooked', 'damaged', 'dancing', 'deployed', 'deranged',
      'destroyed', 'different', 'disordered', 'dispersed', 'disturbed', 'dizzy', 'drunk',
      'eccentric', 'edited', 'excited', 'extraordinary', 'fanciful', 'fantastic',
      'flustered', 'foolish', 'freely', 'fresh', 'garbled', 'in a mess', 'in disorder',
      'in tatters', 'insane', 'involved', 'jumbled', 'loose', 'loony', 'lost', 'mad',
      'mangled', 'mashed', 'messy', 'mixed', 'mobile', 'modified', 'muddled', 'new',
      'novel', 'odd', 'off', 'organised', 'out of order', 'peculiar', 'poor', 'possibly',
      'radical', 'rearranged', 'rebuilt', 'reformed', 'relocated', 'remodelled',
      'reorganised', 'repaired', 'reshuffled', 'restructured', 'revised', 'revolutionary',
      'reworked', 'rewritten', 'ridiculous', 'rotten', 'roughly', 'scattered', 'scrambled',
      'shaken', 'shuffled', 'somehow', 'sorted', 'spread', 'strange', 'strangely',
      'struggling', 'tangled', 'terrible', 'tossed', 'troubled', 'twisted', 'uncertain',
      'unconventional', 'unexpected', 'unhappy', 'unique', 'unruly', 'unsteady',
      'unusual', 'upset', 'varied', 'weird', 'wild', 'wildly', 'working', 'worried',
      'wrecked', 'wrong', 'wrongly',
    ],
  },
  {
    id: 'reversal',
    name: 'Reversal',
    description: 'Signal that letters are written backwards. For down clues, "rising" indicators apply.',
    indicators: [
      // General
      'about', 'back', 'backed', 'backwards', 'capsized', 'in reverse', 'inverted',
      'recalled', 'reflected', 'retiring', 'return', 'returned', 'reversed', 'round',
      'sent back', 'spinning', 'turned', 'turning', 'twisted', 'upset',
      // Across clues (east/west)
      'going west', 'heading west', 'from east', 'westward',
      // Down clues (up)
      'ascending', 'climbing', 'coming up', 'going up', 'mounting', 'rising', 'upended',
      'uprising', 'up',
    ],
  },
  {
    id: 'container',
    name: 'Container / Insertion',
    description: 'One element surrounds or is inserted into another.',
    indicators: [
      // Outer contains inner
      'about', 'absorbing', 'accepting', 'around', 'capturing', 'carrying', 'catching',
      'containing', 'covering', 'embracing', 'enclosing', 'engulfing', 'getting round',
      'going round', 'grabbing', 'gripping', 'harbouring', 'having', 'hiding', 'holding',
      'housing', 'including', 'keeping', 'nursing', 'outside', 'packing', 'protecting',
      'receiving', 'retaining', 'sheltering', 'surrounding', 'swallowing', 'taking in',
      'trapping', 'wearing', 'welcoming', 'with', 'wrapping',
      // Inner enters outer
      'entering', 'going into', 'in', 'inside', 'interrupting', 'penetrating',
      'splitting', 'within',
    ],
  },
  {
    id: 'hidden',
    name: 'Hidden Word',
    description: 'The answer is concealed within the consecutive letters of the clue.',
    indicators: [
      'a bit of', 'a little', 'a piece of', 'bit of', 'coming from', 'concealed by',
      'concealed in', 'contained in', 'embedded in', 'found in', 'from', 'hidden in',
      'in', 'in part', 'inside', 'part of', 'partially', 'partly', 'residing in',
      'secretly in', 'some', 'somewhere in', 'within',
    ],
  },
  {
    id: 'deletion',
    name: 'Deletion',
    description: 'One or more letters are removed from a word.',
    indicators: [
      // Head deletion
      'beheaded', 'headless', 'loses its head', 'topless', 'without its head',
      // Tail deletion
      'curtailed', 'endless', 'loses its tail', 'tailless', 'unfinished',
      // Interior deletion
      'heartless', 'hollow', 'empty',
      // General
      'almost', 'cut', 'dropping', 'in short', 'lacking', 'leaving', 'limitless',
      'losing', 'missing', 'partly', 'removing', 'short', 'shortened', 'stripped',
      'ultimately', 'without',
    ],
  },
  {
    id: 'homophone',
    name: 'Homophone',
    description: 'The answer sounds like another word or phrase.',
    indicators: [
      'allegedly', 'audibly', 'by the sound of it', 'for listeners', 'for the audience',
      'heard', 'I hear', 'in conversation', 'in speech', 'on the radio', 'orally',
      'out loud', 'reportedly', 'said aloud', 'say', 'seemingly', 'so to speak',
      'sounding like', 'sounds like', 'stated', 'they say', 'to a listener', 'verbally',
      'we hear', 'we\'re told', 'word heard',
    ],
  },
  {
    id: 'charade',
    name: 'Charade / Combination',
    description: 'Two or more elements placed end-to-end to form the answer.',
    indicators: [
      'after', 'and', 'before', 'beside', 'by', 'comes after', 'comes before',
      'follows', 'followed by', 'in front of', 'joins', 'leads', 'next to',
      'on', 'precedes', 'then', 'with',
    ],
  },
  {
    id: 'double-def',
    name: 'Double Definition',
    description: 'Two separate definitions of the same word, usually with minimal linking words.',
    indicators: [
      '(none — look for two consecutive definitions)',
      'and', 'but also', 'or',
    ],
  },
];

export const COMMON_ABBREVIATIONS: Abbreviation[] = [
  { abbr: 'A', meanings: ['ace', 'ampere', 'answer', 'area', 'associate'] },
  { abbr: 'B', meanings: ['bishop', 'book', 'born', 'black'] },
  { abbr: 'C', meanings: ['caught', 'century', 'cold', 'conservative', 'circa', 'clubs'] },
  { abbr: 'D', meanings: ['dead', 'democrat', 'daughter', 'day', 'diamonds'] },
  { abbr: 'DR', meanings: ['doctor', 'drive'] },
  { abbr: 'E', meanings: ['east', 'English', 'European', 'energy'] },
  { abbr: 'F', meanings: ['female', 'fine', 'following', 'forte (soft in music)'] },
  { abbr: 'G', meanings: ['good', 'grand (£1000)', 'gravity'] },
  { abbr: 'H', meanings: ['hearts', 'hospital', 'hour', 'hot', 'henry'] },
  { abbr: 'I', meanings: ['island', 'isle', 'one (Roman)'] },
  { abbr: 'K', meanings: ['king', 'knight', 'knave'] },
  { abbr: 'L', meanings: ['lake', 'large', 'left', 'liberal', 'learner', 'fifty (Roman)'] },
  { abbr: 'M', meanings: ['male', 'married', 'medium', 'mile', 'million', 'Monday', 'thousand (Roman)'] },
  { abbr: 'N', meanings: ['north', 'noun', 'knight (chess)'] },
  { abbr: 'O', meanings: ['old', 'zero', 'love (tennis)', 'oxygen'] },
  { abbr: 'P', meanings: ['page', 'parking', 'pawn', 'piano (soft)', 'pressure', 'post'] },
  { abbr: 'Q', meanings: ['queen', 'question'] },
  { abbr: 'R', meanings: ['right', 'river', 'run (cricket)', 'recipe', 'king (rex)'] },
  { abbr: 'S', meanings: ['saint', 'second', 'south', 'small', 'society', 'spades'] },
  { abbr: 'T', meanings: ['time', 'ton', 'Tuesday'] },
  { abbr: 'U', meanings: ['university', 'upper-class', 'uranium', 'you'] },
  { abbr: 'V', meanings: ['five (Roman)', 'velocity', 'versus', 'very', 'victory', 'volt'] },
  { abbr: 'W', meanings: ['west', 'with', 'women', 'watt'] },
  { abbr: 'X', meanings: ['ten (Roman)', 'unknown', 'cross', 'wrong'] },
  { abbr: 'Y', meanings: ['year', 'yen'] },
  { abbr: 'Z', meanings: ['zero'] },
  { abbr: 'SS', meanings: ['saints', 'steamship'] },
  { abbr: 'PM', meanings: ['prime minister', 'afternoon'] },
  { abbr: 'MP', meanings: ['member of parliament', 'military police'] },
  { abbr: 'RE', meanings: ['Royal Engineers', 'about', 'religious education'] },
  { abbr: 'TA', meanings: ['Territorial Army', 'thanks'] },
  { abbr: 'AI', meanings: ['first class', 'artificial intelligence'] },
  { abbr: 'NT', meanings: ['National Trust', 'New Testament', 'not'] },
  { abbr: 'OT', meanings: ['Old Testament', 'overtime'] },
  { abbr: 'CE', meanings: ['Church of England', 'civil engineer'] },
];
