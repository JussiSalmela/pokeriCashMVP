import { View, Text, StyleSheet, TextInput, Button } from 'react-native'
import React, { useEffect } from 'react'
import { GameState, Player, Round } from '../types'

type Props = {
   player: Player,
   index: number,
   gameState: GameState,
   setGameState: React.Dispatch<React.SetStateAction<GameState>>
   winner: (index: number) => void,
   removePlayer: (index: number) => void,
}

export default function PlayerListItem({ player, index, gameState, setGameState, winner, removePlayer }: Props) {

   const [positon, setPosition] = React.useState('');
   const [betValue, setBetValue] = React.useState('');
   const [betPercentage, setBetPercentage] = React.useState('');
   const [addBalance, setAddBalance] = React.useState('');

   useEffect(() => {
      calculatePlayerPosition()
   }, [gameState.dealer])

   const calculatePlayerPosition = () => {
      console.log(gameState.players.length)
      if (gameState.dealer === null) return
      if (index === (gameState.dealer + 1) % gameState.players.length) {
         setPosition('(SB)')
      } else if (index === (gameState.dealer + 2) % gameState.players.length) {
         setPosition('(BB)')
      } else {
         setPosition('')
      }
   }

   const bet = (value: number) => {
      const bet = value
      if (bet > 0 && bet <= player.balance && bet >= gameState.toCall) {
         const newPlayers = [...gameState.players]
         const toCall = newPlayers[index].bet + bet
         newPlayers[index].balance -= bet
         newPlayers[index].bet += bet
         setGameState({ ...gameState, players: newPlayers, pot: gameState.pot + bet, toCall: toCall })
         setBetValue('')
         setBetPercentage('')
      }
   }

   const call = () => {
      const bet = gameState.toCall
      const newPlayers = [...gameState.players]
      let call = bet - newPlayers[index].bet
      newPlayers[index].balance -= call
      newPlayers[index].bet = bet
      setGameState({ ...gameState, players: newPlayers, pot: gameState.pot + call })
      setBetValue('')
      setBetPercentage('')
   }


   return (
      <View style={styles.container}>
         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
               <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontWeight: 'bold' }}>{player.name}</Text>
                  <Text>{index === gameState.dealer ? '   (BTN)' : null}</Text>
                  <Text>   {positon}</Text>
                  <Text style={{ fontWeight: 'bold' }}>   {player.folded ? 'Fold' : ''}</Text>
               </View>
               <Text>Balance: {(player.balance / 100).toFixed(2)} €</Text>
            </View>
            <View>
               <Text>Bet: {(player.bet / 100).toFixed(2)} €</Text>
            </View>
         </View>
         {player.folded ? (
            null
         )
            : gameState.round === Round.End ? (
               <>
                  <TextInput
                     value={addBalance}
                     onChangeText={text => {
                        setAddBalance(text)
                     }}
                     style={[styles.input, { width: 150 }]}
                     keyboardType="numeric"
                     placeholder="Add balance (snt)"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                     <Button
                        title="Add balance"
                        onPress={() => {
                           const add = parseInt(addBalance)
                           if (add > 0) {
                              const newPlayers = [...gameState.players]
                              newPlayers[index].balance += add
                              setGameState({ ...gameState, players: newPlayers })
                              setAddBalance('')
                           }
                        }}
                     />
                     <Button
                        title="Leave game"
                        onPress={() => removePlayer(index)}
                     />
                  </View>
               </>
            ) : gameState.round === Round.Showdown ? (
               player.folded ? null : (
                  <Button
                     title="Winner"
                     onPress={() => {
                        if (winner) {
                           winner(index)
                        }
                     }}
                  />
               )
            ) : (
               <>
                  <View style={{ flexDirection: 'row' }}>
                     <TextInput
                        value={betValue}
                        onChangeText={text => {
                           setBetValue(text)
                           text === '' ? setBetPercentage('') : setBetPercentage(Math.ceil((parseInt(text) / gameState.pot) * 100).toString())
                        }}
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Bet (snt)"
                     />
                     <TextInput
                        value={betPercentage}
                        onChangeText={text => {
                           setBetPercentage(text)
                           text === '' ? setBetValue('') : setBetValue(Math.ceil(gameState.pot * (parseInt(text) / 100)).toString())
                        }}
                        style={[styles.input,{marginLeft: 10}]}
                        keyboardType="numeric"
                        placeholder="Bet %"
                     />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                     <Button
                        title="Bet"
                        onPress={() => bet(parseInt(betValue))}
                     />
                     <Button
                        title="All-in"
                        onPress={() => bet(player.balance)}
                     />
                     <Button
                        title={gameState.toCall <= player.bet ? 'Check' : 'Call'}
                        onPress={() => {
                           if (gameState.toCall != 0) {
                              call()
                           }
                        }}
                     />
                     <Button
                        title="Fold"
                        onPress={() => {
                           const newPlayers = [...gameState.players]
                           newPlayers[index].folded = true
                           setGameState({ ...gameState, players: newPlayers })
                        }}
                     />
                  </View>
               </>
            )}
      </View>
   )
}

const styles = StyleSheet.create({
   container: {
      margin: 2,
      padding: 10,
      borderWidth: 1,
      borderRadius: 10,
   },
   input: {
      marginVertical: 12,
      borderRadius: 15,
      padding: 10,
      width: 100,
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