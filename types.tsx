type Player = {
   name: string,
   balance: number,
   bet: number,
   totalBet: number,
   folded: boolean,
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
}

enum Round {
   PreFlop = 'PreFlop',
   Flop = 'Flop',
   Turn = 'Turn',
   River = 'River',
   Showdown = 'Showdown',
   End = 'End'
}

export { Player, GameState, Round }