import { View, Text, FlatList, Button, TextInput, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GameState, Player, Round } from '../types'
import PlayerListItem from '../components/PlayerListItem'

export default function MainScreen() {

   const [newPlayer, setNewPlayer] = useState({
      name: '',
      balance: 0,
   })

   const [gameState, setGameState] = useState<GameState>({
      players: [
         // {
         //    name: 'Jussi',
         //    balance: 1000,
         //    bet: 0,
         //    totalBet: 0,
         //    folded: false
         // },
         // {
         //    name: 'Kalle',
         //    balance: 500,
         //    bet: 0,
         //    totalBet: 0,
         //    folded: false
         // },
         // {
         //    name: 'Pertti',
         //    balance: 300,
         //    bet: 0,
         //    totalBet: 0,
         //    folded: false
         // },
      ],
      pot: 0,
      toCall: 0,
      smallBlind: 5,
      bigBlind: 10,
      dealer: null,
      round: Round.End,
      turn: 0,
      lastAction: 0,
      roundStart: true
   })

   const [winners, setWinners] = useState<number[]>([]);

   useEffect(() => {
      if (gameState.players.length < 2) return;
      const activePlayers = gameState.players.filter(player => !player.folded);
      if (activePlayers.length === 1) {
         const winner = activePlayers[0];
         winner.balance += gameState.pot;
         setGameState({
            ...gameState,
            players: gameState.players.map(player => player.name === winner.name ? winner : { ...player, folded: false }),
            round: Round.End,
            pot: 0,
            toCall: 0,
         });
      }
   }, [gameState.players]);

   useEffect(() => {
      if (gameState.players.length < 2) return;
      const newPlayers = [...gameState.players];
      let activePlayers = newPlayers.filter(player => !player.folded && player.balance > 0);
      if (activePlayers.length === 0 && (gameState.round != Round.Showdown && gameState.round != Round.End)) {
         changeStage();
         return;
      }
      if (activePlayers.length === 1 && (activePlayers[0].bet >= gameState.toCall && gameState.round != Round.Showdown && gameState.round != Round.End)) {
         changeStage();
         return;
      }
      if (gameState.roundStart) return;
      if (gameState.turn === gameState.lastAction) {
         changeStage();
         return;
      }
   }, [gameState.turn, gameState.round]);

   const calculateWinnings = () => {
      if (winners.length === 0) return;
      const newPlayers = [...gameState.players];
      let winningPlayers = [...winners];
      newPlayers.forEach(player => {
         player.folded = false;
      });
      let totalPot = gameState.pot;

      while (winningPlayers.some(winnerIndex => newPlayers[winnerIndex].totalBet > 0)) {
         let smallestTotalOfWinners = Math.min(...winningPlayers.map(winnerIndex => newPlayers[winnerIndex].totalBet));

         let winningPot = 0;

         newPlayers.forEach((player) => {
            const contribution = Math.min(smallestTotalOfWinners, player.totalBet);
            winningPot += contribution;
            player.totalBet -= contribution;
         });

         const winnings = Math.floor(winningPot / winningPlayers.length);
         const leftovers = winningPot % winningPlayers.length;

         winningPlayers.forEach((winnerIndex, i) => {
            newPlayers[winnerIndex].balance += winnings;
            if (i < leftovers) {
               newPlayers[winnerIndex].balance += 1;
            }
         });
         winningPlayers = winningPlayers.filter(winnerIndex => newPlayers[winnerIndex].totalBet > 0);
         totalPot -= winningPot;
      }

      setWinners([]);

      let playersWithBet = newPlayers.filter(player => player.totalBet > 0);

      if (playersWithBet.length === 1) {
         playersWithBet[0].balance += playersWithBet[0].totalBet;
         playersWithBet[0].totalBet = 0;
         setGameState({
            ...gameState,
            players: newPlayers,
            pot: 0,
            round: Round.End,
         });
      }

      if (newPlayers.some(player => player.totalBet > 0)) {
         setGameState({
            ...gameState,
            players: newPlayers,
            pot: totalPot,
         });
         return;
      }

      setGameState({
         ...gameState,
         players: newPlayers,
         pot: 0,
         round: Round.End,
      });
   };

   const removePlayer = (index: number) => {
      const newPlayers = [...gameState.players]
      newPlayers.splice(index, 1)
      setGameState({ ...gameState, players: newPlayers })
   }

   const setWinnersArray = (index: number) => {
      if (winners.includes(index)) {
         setWinners(winners.filter(winner => winner !== index));
      } else {
         setWinners([...winners, index]);
      }
   }

   const changeStage = () => {
      const newPlayers = [...gameState.players]
      newPlayers.forEach(player => {
         player.bet = 0
      })
      let nextRound = gameState.round;
      switch (gameState.round) {
         case Round.PreFlop:
            nextRound = Round.Flop;
            break;
         case Round.Flop:
            nextRound = Round.Turn;
            break;
         case Round.Turn:
            nextRound = Round.River;
            break;
         case Round.River:
            nextRound = Round.Showdown;
            break;
         default:
            break;
      }
      setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0, turn: gameState.dealer != null ? (gameState.dealer + 1) % gameState.players.length : 0, lastAction: gameState.dealer != null ? (gameState.dealer + 1) % gameState.players.length : 0, roundStart: true })
   }



   return (
      <View style={styles.mainContainer}>
         <View style={styles.newPlayerContainer}>
            <TextInput
               value={newPlayer.name}
               onChangeText={text => setNewPlayer({ ...newPlayer, name: text })}
               style={styles.input}
               placeholder="Name"
            />
            <TextInput
               value={newPlayer.balance !== 0 ? newPlayer.balance.toString() : ''}
               onChangeText={text => setNewPlayer({ ...newPlayer, balance: text ? parseInt(text) : 0 })}
               style={styles.input}
               keyboardType="numeric"
               placeholder="Buy-in (snt)"
            />
            <View>
               <Button
                  title='Add player'
                  onPress={() => {
                     setGameState({
                        ...gameState,
                        players: [...gameState.players, {
                           name: newPlayer.name,
                           balance: newPlayer.balance,
                           bet: 0,
                           totalBet: 0,
                           folded: false
                        }]
                     })
                     setNewPlayer({ name: '', balance: 0 })
                  }}
                  disabled={newPlayer.name === '' || newPlayer.balance === 0 || gameState.round !== Round.End || gameState.players.some(player => player.name === newPlayer.name)}
               />
            </View>
         </View>
         <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
            <View
               style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
               <View style={{ flexDirection: 'column' }}>
                  <Text>Big blind: {(gameState.bigBlind / 100).toFixed(2)} €</Text>
                  <Text>Small blind: {(gameState.smallBlind / 100).toFixed(2)} €</Text>
               </View>
               <TextInput
                  value={gameState.bigBlind !== 0 ? gameState.bigBlind.toString() : ''}
                  onChangeText={text => {
                     setGameState({ ...gameState, bigBlind: text ? parseInt(text) : 0, smallBlind: text ? Math.ceil(parseInt(text) / 2) : 0 })
                  }}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="BB (cent)"
                  editable={gameState.round === Round.End}
               />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={{ fontWeight: 'bold' }}>Pot: {(gameState.pot / 100).toFixed(2)} €</Text>
               {gameState.round === Round.End ? null : <Text style={{ fontWeight: 'bold' }}>{gameState.round}</Text>}
               {gameState.round === Round.End && gameState.players.length > 1 && !gameState.players.some(player => player.balance < gameState.bigBlind) && gameState.bigBlind > 0 ? (
                  <Button
                     title="Start"
                     onPress={() => {
                        const newPlayers = [...gameState.players]
                        newPlayers.forEach(player => {
                           player.bet = 0
                           // player.totalBet = 0
                        })
                        let nextRound = Round.PreFlop;
                        let dealer;
                        if (gameState.dealer === null) {
                           dealer = Math.floor(Math.random() * gameState.players.length);
                        } else {
                           dealer = (gameState.dealer + 1) % gameState.players.length;
                        }
                        newPlayers[(dealer + 1) % gameState.players.length].bet = gameState.smallBlind;
                        newPlayers[(dealer + 1) % gameState.players.length].totalBet = gameState.smallBlind;
                        newPlayers[(dealer + 1) % gameState.players.length].balance -= gameState.smallBlind;
                        newPlayers[(dealer + 2) % gameState.players.length].bet = gameState.bigBlind;
                        newPlayers[(dealer + 2) % gameState.players.length].totalBet = gameState.bigBlind;
                        newPlayers[(dealer + 2) % gameState.players.length].balance -= gameState.bigBlind;
                        setGameState({
                           ...gameState,
                           players: newPlayers,
                           round: nextRound,
                           toCall: gameState.bigBlind,
                           pot: gameState.smallBlind + gameState.bigBlind,
                           dealer: dealer,
                           turn: (dealer + 3) % gameState.players.length,
                           lastAction: (dealer + 3) % gameState.players.length,
                           roundStart: true
                        })
                     }}
                  />
               ) : null}
               <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: 'bold' }}>To call: {(gameState.toCall / 100).toFixed(2)} €</Text>
               </View>
            </View>
            {/* <Text>winners: {winners}</Text> */}
            {/* <Text>rounstart: {gameState.roundStart.toString()}, lastAction: {gameState.lastAction}</Text> */}
            {gameState.round === Round.Showdown ? (
               <Button
                  title="Winner, winner, chicken dinner"
                  onPress={() => {
                     calculateWinnings()
                  }}
               />
            ) : null}
         </View>
         <FlatList
            style={{ flex: 1 }}
            data={gameState.players}
            renderItem={({ item, index }) => (
               <View key={index}>
                  <PlayerListItem
                     player={item}
                     index={index}
                     gameState={gameState}
                     setGameState={setGameState}
                     removePlayer={removePlayer}
                     setWinnersArray={setWinnersArray}
                     winners={winners}
                  />
               </View>
            )}
            keyExtractor={item => item.name}
         />
      </View>
   )
}

const styles = StyleSheet.create({
   mainContainer: {
      marginTop: 40,
      flex: 1,
   },
   newPlayerContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
   },
   input: {
      margin: 12,
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 10,
      width: 130,
      backgroundColor: 'white',
      shadowColor: "#000",
      shadowOffset: {
         width: 0,
         height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
   },
   basicButton: {
      marginVertical: 20,
      // width: 200,
      alignSelf: 'center',
      borderRadius: 30,
   },
});