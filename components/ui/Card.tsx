import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export default function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 14,
    padding: 12,
  },
})