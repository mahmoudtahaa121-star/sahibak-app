import { View, Text, StyleSheet } from 'react-native'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return [styles.badge, styles.success]
      case 'warning':
        return [styles.badge, styles.warning]
      case 'danger':
        return [styles.badge, styles.danger]
      case 'info':
        return [styles.badge, styles.info]
      default:
        return [styles.badge, styles.defaultBadge]
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText
      case 'warning':
        return styles.warningText
      case 'danger':
        return styles.dangerText
      case 'info':
        return styles.infoText
      default:
        return styles.defaultText
    }
  }

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  danger: {
    backgroundColor: '#FEE2E2',
  },
  info: {
    backgroundColor: '#DBEAFE',
  },
  defaultBadge: {
    backgroundColor: '#F8F9FA',
  },
  successText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#059669',
  },
  warningText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#D97706',
  },
  dangerText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#DC2626',
  },
  infoText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#2563EB',
  },
  defaultText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#6C757D',
  },
})