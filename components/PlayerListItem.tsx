import { View, Text, StyleSheet, TextInput, Button } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GameState, Player, Round } from '../types'
import { CheckBox } from '@rneui/themed';

type Props = {
   player: Player,
   index: number,
   gameState: GameState,
   setGameState: React.Dispatch<React.SetStateAction<GameState>>
   removePlayer: (index: number) => void,
   setWinnersArray: (index: number) => void,
   winners: number[]
}

export default function PlayerListItem({ player, index, gameState, setGameState, removePlayer, setWinnersArray, winners }: Props) {

   const [positon, setPosition] = useState('');
   const [betValue, setBetValue] = useState('');
   const [betPercentage, setBetPercentage] = useState('');
   const [addBalance, setAddBalance] = useState('');
   const [toggleCheckBox, setToggleCheckBox] = useState(false)

   useEffect(() => {
      calculatePlayerPosition()
   }, [gameState.dealer])

   useEffect(() => {
      if ((gameState.turn === index && player.folded) || (gameState.turn === index && player.balance === 0 && gameState.round != Round.Showdown && gameState.round != Round.End)) {
         setGameState({ ...gameState, turn: (gameState.turn + 1) % gameState.players.length, roundStart: false })
      }
   }, [gameState.turn])

   useEffect(() => {
      if (winners.length === 0) setToggleCheckBox(false);
   }, [winners])

   const calculatePlayerPosition = () => {
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
      const newPlayers = [...gameState.players]
      const toCall = newPlayers[index].bet + bet
      if (bet === player.balance || (bet >= gameState.bigBlind && bet <= player.balance && toCall >= gameState.toCall * 2)) {
         newPlayers[index].balance -= bet
         newPlayers[index].bet += bet
         newPlayers[index].totalBet += bet
         setGameState({ ...gameState, players: newPlayers, pot: (gameState.pot + bet), toCall: toCall, turn: (gameState.turn + 1) % gameState.players.length, roundStart: false, lastAction: index })
         setBetValue('')
         setBetPercentage('')
      }
   }

   const call = () => {
      const bet = gameState.toCall
      const newPlayers = [...gameState.players]
      let call;
      if (bet > player.balance) {
         call = player.balance;
      } else {
         call = bet - newPlayers[index].bet
      }
      newPlayers[index].balance -= call
      newPlayers[index].totalBet += call
      newPlayers[index].bet += call
      setGameState({ ...gameState, players: newPlayers, pot: (gameState.pot + call), turn: (gameState.turn + 1) % gameState.players.length, roundStart: false })
      setBetValue('')
      setBetPercentage('')
   }


   return (
      <View style={[styles.container, { backgroundColor: gameState.turn === index || gameState.round === Round.Showdown || gameState.round === Round.End ? 'white' : 'lightgray' }]}>
         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
               <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontWeight: 'bold' }}>{player.name}</Text>
                  <Text>{index === gameState.dealer ? '   (BTN)' : null}</Text>
                  <Text>{positon != '' ? '   ' + positon : ''}</Text>
                  <Text style={{ fontWeight: 'bold' }}>{player.folded ? '   FOLD' : ''}</Text>
                  <Text style={{ fontWeight: 'bold' }}>{player.balance === 0 ? '   ALL-IN' : ''}</Text>
               </View>
               <Text>Balance: {(player.balance / 100).toFixed(2)} €</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text>Total bet: {(player.totalBet / 100).toFixed(2)} €</Text>
               <Text>Round bet: {(player.bet / 100).toFixed(2)} €</Text>
            </View>
         </View>
         {
            player.folded ? (
               null
            ) :
               gameState.round === Round.End ? (
                  <>
                     <TextInput
                        value={addBalance}
                        onChangeText={text => {
                           setAddBalance(text)
                        }}
                        style={[styles.input, { width: 150 }]}
                        keyboardType="numeric"
                        placeholder="Add balance (cent)"
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
               ) :
                  gameState.round === Round.Showdown ? (
                     player.folded || player.totalBet === 0 ? null : (
                        <>
                           <CheckBox
                              title="Winner"
                              checked={toggleCheckBox}
                              onPress={() => {
                                 setToggleCheckBox(!toggleCheckBox)
                                 setWinnersArray(index);
                              }}
                           />
                        </>
                     )
                  ) :
                     gameState.turn === index && !player.folded ? (
                        <>
                           <View style={{ flexDirection: 'row', alignItems:'center', marginBottom: 20 }}>
                              <TextInput
                                 value={betValue}
                                 onChangeText={text => {
                                    setBetValue(text)
                                    text === '' ? setBetPercentage('') : setBetPercentage(Math.ceil((parseInt(text) / gameState.pot) * 100).toString())
                                 }}
                                 style={styles.input}
                                 keyboardType="numeric"
                                 placeholder={gameState.toCall > 0 ? "Raise (cent)" : "Bet (cent)"}
                              />
                              <TextInput
                                 value={betPercentage}
                                 onChangeText={text => {
                                    setBetPercentage(text)
                                    text === '' ? setBetValue('') : setBetValue(Math.ceil(gameState.pot * (parseInt(text) / 100)).toString())
                                 }}
                                 style={[styles.input, { marginLeft: 10 }]}
                                 keyboardType="numeric"
                                 placeholder={gameState.toCall > 0 ? "Raise pot%" : "Bet pot%"}
                              />
                              <View style={{marginLeft: 20}}>
                                 <Button
                                    title='Min raise'
                                    onPress={() => {
                                       const minRaise = Math.max(gameState.toCall * 2 - player.bet, gameState.bigBlind)
                                       setBetValue(minRaise.toString())
                                       setBetPercentage(Math.ceil((minRaise / gameState.pot) * 100).toString())
                                    }}
                                 />
                              </View>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Button
                                 title={gameState.toCall > 0 ? "Raise" : "Bet"}
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
                                    } else {
                                       setGameState({ ...gameState, turn: (gameState.turn + 1) % gameState.players.length, roundStart: false })

                                    }
                                 }}
                              />
                              <Button
                                 title="Fold"
                                 onPress={() => {
                                    const newPlayers = [...gameState.players]
                                    newPlayers[index].folded = true
                                    setGameState({ ...gameState, players: newPlayers, turn: (gameState.turn + 1) % gameState.players.length, roundStart: false })
                                 }}
                              />
                           </View>
                        </>
                     ) : (null)}
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