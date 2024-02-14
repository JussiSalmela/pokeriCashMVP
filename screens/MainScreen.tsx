import { View, Text, FlatList, Button, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Keyboard } from 'react-native'
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
         { name: 'Pelaaja 1', balance: 1000, bet: 0, folded: false },
         { name: 'Pelaaja 2', balance: 1000, bet: 0, folded: false },
      ],
      pot: 0,
      toCall: 0,
      smallBlind: 5,
      bigBlind: 10,
      dealer: null,
      round: Round.End,
      turn: 0,
   })

   //if only one player left, give the pot to him and start new hand
   useEffect(() => {
      if (gameState.players.length < 2) return;
      const activePlayers = gameState.players.filter(player => !player.folded);
      if (activePlayers.length === 1) {
         const winner = activePlayers[0];
         winner.balance += gameState.pot;
         setGameState({
            ...gameState,
            players: gameState.players.map(player => player.name === winner.name ? winner : player),
            round: Round.End,
         });
      }
   }, [gameState]);

   const winner = (index: number) => {
      const winner = gameState.players[index]
      winner.balance += gameState.pot;
      setGameState({
         ...gameState,
         players: gameState.players.map(player => player.name === winner.name ? winner : player),
         round: Round.End,
      });
   }

   const removePlayer = (index: number) => {
      const newPlayers = [...gameState.players]
      newPlayers.splice(index, 1)
      setGameState({ ...gameState, players: newPlayers })
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
               // onBlur={() => {Keyboard.dismiss()}}
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
                  placeholder="BB (snt)"
                  editable={gameState.round === Round.End}
               />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={{ fontWeight: 'bold' }}>Pot: {(gameState.pot / 100).toFixed(2)} €</Text>
               {gameState.round === Round.End ? null : <Text style={{ fontWeight: 'bold' }}>{gameState.round}</Text>}
               <Button
                  title={gameState.round === Round.End ? "Start" : "Next stages"}
                  onPress={() => {
                     const newPlayers = [...gameState.players]
                     newPlayers.forEach(player => {
                        player.bet = 0
                     })
                     let nextRound = gameState.round;
                     switch (gameState.round) {
                        case Round.End:
                           nextRound = Round.PreFlop;
                           let dealer;
                           if (gameState.dealer === null) {
                              dealer = Math.floor(Math.random() * gameState.players.length);
                           } else {
                              dealer = (gameState.dealer + 1) % gameState.players.length;
                           }
                           newPlayers[(dealer + 1) % gameState.players.length].bet = gameState.smallBlind;
                           newPlayers[(dealer + 1) % gameState.players.length].balance -= gameState.smallBlind;
                           newPlayers[(dealer + 2) % gameState.players.length].bet = gameState.bigBlind;
                           newPlayers[(dealer + 2) % gameState.players.length].balance -= gameState.bigBlind;
                           setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: gameState.bigBlind, pot: gameState.smallBlind + gameState.bigBlind, dealer: dealer })
                           break;
                        case Round.PreFlop:
                           nextRound = Round.Flop;
                           setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0 })
                           break;
                        case Round.Flop:
                           nextRound = Round.Turn;
                           setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0 })
                           break;
                        case Round.Turn:
                           nextRound = Round.River;
                           setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0 })
                           break;
                        case Round.River:
                           nextRound = Round.Showdown;
                           setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0 })
                           break;
                        default:
                           break;
                     }
                     // setGameState({ ...gameState, players: newPlayers, round: nextRound, toCall: 0 })
                  }}
               />
               <Text style={{ fontWeight: 'bold' }}>To call: {(gameState.toCall / 100).toFixed(2)} €</Text>
            </View>
         </View>
         <FlatList
            style={{ flex: 1 }}
            data={gameState.players}
            renderItem={({ item, index }) => (
               <View key={index}>
                  <PlayerListItem player={item} index={index} gameState={gameState} setGameState={setGameState} winner={winner} removePlayer={removePlayer}/>
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