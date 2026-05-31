import React from 'react';
import { StyleSheet, TouchableOpacity, ImageBackground, View } from 'react-native';
import Animated from 'react-native-reanimated';

type Props = {
  difficulty: 'SOFT' | 'FUN' | 'HOT';
  isFlipped: boolean;
  onFlip: () => void;
  backAnimatedStyle: any;
  frontAnimatedStyle: any;
  children: React.ReactNode;
};

export default function PlayingCard({ difficulty, isFlipped, onFlip, backAnimatedStyle, frontAnimatedStyle, children }: Props) {
  
  const getCardBackImage = () => {
    switch (difficulty) {
      case 'SOFT': return require('./assets/card_green.png');
      case 'FUN': return require('./assets/card_orange.png');
      case 'HOT': return require('./assets/card_red.png');
      default: return require('./assets/card_green.png');
    }
  };

  const getBorderColor = () => {
    switch (difficulty) {
      case 'SOFT': return '#28a745';
      case 'FUN': return '#fd7e14';
      case 'HOT': return '#dc3545';
      default: return '#fff';
    }
  };

  return (
    <TouchableOpacity onPress={onFlip} disabled={isFlipped} style={styles.cardContainer} activeOpacity={1}>
      
      {/* DOS DE LA CARTE */}
      <Animated.View style={[styles.card, styles.backFace, backAnimatedStyle]}>
        <ImageBackground 
          source={getCardBackImage()} 
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        />
      </Animated.View>

      {/* FACE DE LA CARTE */}
      <Animated.View style={[
        styles.card, 
        styles.frontFace, 
        frontAnimatedStyle, 
        { borderColor: getBorderColor(), borderWidth: 13, borderRadius: 20 } // <-- La fameuse bordure !
      ]}>
        {/* On englobe le contenu pour le protéger de la bordure */}
        <View style={styles.contentWrapper}>
          {children}
        </View>
      </Animated.View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: { width: 300, height: 450 },
  card: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    borderRadius: 20, 
    backfaceVisibility: 'hidden',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  backFace: { zIndex: 2 },
  frontFace: { zIndex: 1 },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  imageBackground: { flex: 1, width: '100%', height: '100%' },
  imageStyle: { borderRadius: 20 }
});