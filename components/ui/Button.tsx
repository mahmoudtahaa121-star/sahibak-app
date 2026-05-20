import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native'

type ButtonVariant = 'primary' | 'outline' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const style: ViewStyle = { ...styles.button }
    
    if (variant === 'primary') {
      style.backgroundColor = '#1B4332'
    } else if (variant === 'outline') {
      style.backgroundColor = 'transparent'
      style.borderWidth = 2
      style.borderColor = '#1B4332'
    } else if (variant === 'danger') {
      style.backgroundColor = '#C62828'
    }

    if (fullWidth) {
      style.width = '100%'
    }

    if (disabled || loading) {
      style.opacity = 0.5
    }

    return style
  }

  const getTextStyle = (): TextStyle => {
    const style: TextStyle = { ...styles.text }

    if (variant === 'primary') {
      style.color = '#FFFFFF'
    } else if (variant === 'outline') {
      style.color = '#1B4332'
    } else if (variant === 'danger') {
      style.color = '#FFFFFF'
    }

    if (disabled || loading) {
      style.color = '#ADB5BD'
    }

    return style
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#1B4332' : '#FFFFFF'} />
      ) : (
        <Text style={getTextStyle()}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
  },
})