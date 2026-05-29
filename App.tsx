import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { initDatabase, getRandomCard, Card } from './database';

type Player = {
  name: string;
  gender: 'M' | 'F';
  score: number;
};

type GameState = 'setup' | 'playing';

export default function App() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [chosenType, setChosenType] = useState<'ACTION' | 'VERITE' | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  const [inputText, setInputText] = useState('');
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>('M');
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Victor', gender: 'M', score: 0 },
    { name: 'Julie', gender: 'F', score: 0 }
  ]);

  const handleAddPlayer = () => {
    if (inputText.trim().length > 0 && players.length < 10) {
      setPlayers([...players, { name: inputText.trim(), gender: selectedGender, score: 0 }]);
      setInputText('');
    }
  };

  const handleRemovePlayer = (indexToRemove: number) => {
    setPlayers(players.filter((_, index) => index !== indexToRemove));
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentPlayerIndex(0);
    setChosenType(null);
    setCurrentCard(null);
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    setChosenType(null);
    setCurrentCard(null);
  };

  const handleSuccess = () => {
    nextTurn();
  };

  const handleFail = () => {
    if (currentCard) {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += currentCard.shots; 
      setPlayers(updatedPlayers);
    }
    nextTurn();
  };

  const handleDrawCard = async (difficulty: 'SOFT' | 'FUN' | 'HOT') => {
    if (chosenType) {
      const card = await getRandomCard(chosenType, difficulty);
      if (card) {
        setCurrentCard(card);
      } else {
        alert("Oups, aucune carte trouvée pour ce niveau !");
      }
    }
  };

  if (gameState === 'playing') {
    const currentPlayer = players[currentPlayerIndex];

    return (
      <SafeAreaView style={styles.gameContainer}>
        <TouchableOpacity style={styles.homeButton} onPress={() => setGameState('setup')}>
          <MaterialIcons name="home" size={32} color="#aaa" />
        </TouchableOpacity>

        <Text style={styles.turnSubtitle}>C'est au tour de</Text>
        <Text style={[styles.turnName, currentPlayer.gender === 'M' ? styles.textMale : styles.textFemale]}>
          {currentPlayer.name}
        </Text>
        
        <Text style={styles.scoreText}>Gorgées accumulées : {currentPlayer.score} 🍺</Text>

        {currentCard ? (
          <View style={styles.cardDisplay}>
            <Text style={styles.cardType}>{currentCard.type} • {currentCard.difficulty}</Text>
            <Text style={styles.cardContent}>{currentCard.content}</Text>
            <Text style={styles.cardShots}>Pénalité : {currentCard.shots} gorgée(s)</Text>
            
            <View style={styles.cardButtons}>
              <TouchableOpacity style={styles.successButton} onPress={handleSuccess}>
                <Text style={styles.btnText}>C'est fait ! 😎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.failButton} onPress={handleFail}>
                <Text style={styles.btnText}>Refusé ({currentCard.shots} 🍺)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : chosenType ? (
          <View style={styles.difficultyContainer}>
            <Text style={styles.instructionText}>Choisis ton niveau :</Text>
            <TouchableOpacity style={[styles.diffBtn, styles.softBtn]} onPress={() => handleDrawCard('SOFT')}><Text style={styles.diffText}>SOFT 🟢</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, styles.funBtn]} onPress={() => handleDrawCard('FUN')}><Text style={styles.diffText}>FUN 🟠</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, styles.hotBtn]} onPress={() => handleDrawCard('HOT')}><Text style={styles.diffText}>HOT 🔴</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.choiceContainer}>
            <TouchableOpacity style={[styles.choiceButton, styles.actionButton]} onPress={() => setChosenType('ACTION')}><Text style={styles.choiceText}>ACTION</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.choiceButton, styles.truthButton]} onPress={() => setChosenType('VERITE')}><Text style={styles.choiceText}>VÉRITÉ</Text></TouchableOpacity>
          </View>
        )}
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Truth Or Shot ! 🍻</Text>
      <View style={styles.genderSelector}>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'M' && styles.genderBtnActiveM]} onPress={() => setSelectedGender('M')}><Text style={styles.genderText}>👦 Garçon</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'F' && styles.genderBtnActiveF]} onPress={() => setSelectedGender('F')}><Text style={styles.genderText}>👧 Fille</Text></TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Prénom..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
      </View>
      <FlatList data={players} renderItem={({ item, index }) => (
        <View style={[styles.playerCard, item.gender === 'M' ? styles.cardMale : styles.cardFemale]}>
          <Text style={styles.playerName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleRemovePlayer(index)}><Text>❌</Text></TouchableOpacity>
        </View>
      )} />
      {players.length >= 2 && <TouchableOpacity style={styles.playButton} onPress={startGame}><Text style={styles.playButtonText}>JOUER 🚀</Text></TouchableOpacity>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  title: { color: '#ff007f', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  genderSelector: { flexDirection: 'row', marginBottom: 10 },
  genderBtn: { flex: 1, padding: 10, backgroundColor: '#1e1e1e', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  genderBtnActiveM: { backgroundColor: '#00bfff' },
  genderBtnActiveF: { backgroundColor: '#ff69b4' },
  genderText: { color: '#fff' },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', height: 50, borderRadius: 10, paddingHorizontal: 15 },
  addButton: { backgroundColor: '#8a2be2', width: 50, borderRadius: 10, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 5 },
  cardMale: { backgroundColor: '#1a2a3a', borderLeftColor: '#00bfff' },
  cardFemale: { backgroundColor: '#3a1a2a', borderLeftColor: '#ff69b4' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  playButton: { backgroundColor: '#28a745', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  playButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gameContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  homeButton: { position: 'absolute', top: 50, left: 20 },
  turnSubtitle: { color: '#aaa', fontSize: 20 },
  turnName: { fontSize: 40, fontWeight: '900', color: '#fff' },
  textMale: { color: '#00bfff' },
  textFemale: { color: '#ff69b4' },
  scoreText: { color: '#ff007f', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  choiceContainer: { width: '100%', gap: 20 },
  choiceButton: { padding: 30, borderRadius: 20, alignItems: 'center' },
  actionButton: { backgroundColor: '#ff007f' },
  truthButton: { backgroundColor: '#8a2be2' },
  choiceText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  difficultyContainer: { width: '100%', gap: 15 },
  instructionText: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 10 },
  diffBtn: { padding: 20, borderRadius: 15, alignItems: 'center' },
  softBtn: { backgroundColor: '#28a745' },
  funBtn: { backgroundColor: '#fd7e14' },
  hotBtn: { backgroundColor: '#dc3545' },
  diffText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cardDisplay: { backgroundColor: '#1e1e1e', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center' },
  cardType: { color: '#888', marginBottom: 10 },
  cardContent: { color: '#fff', fontSize: 24, textAlign: 'center', marginBottom: 20 },
  cardShots: { color: '#ff007f', fontSize: 18, marginBottom: 20 },
  cardButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  successButton: { flex: 1, backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
  failButton: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});