type Player = {
   name: string,
   balance: number,
   bet: number,
   totalBet: number,
   folded: boolean,
   buyin: number,
}

type GameState = {
   players: Player[],
   pot: number,
   toCall: number,
   smallBlind: number,
   bigBlind: number,
   dealer: number | null,
   round: Round,
   turn: number,
   lastAction: number,
   roundStart: boolean
}

enum Round {
   PreFlop = 'Preflop',
   Flop = 'Flop',
   Turn = 'Turn',
   River = 'River',
   Showdown = 'Showdown',
   End = 'End'
}

export { Player, GameState, Round }