import { View, Text, StyleSheet } from 'react-native';
import { PlaceService } from '../../types';

interface Props {
  services: PlaceService[];
}

export default function PlaceServices({ services }: Props) {
  if (!services || services.length === 0) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠 الخدمات المتاحة</Text>
      {services.map((service, index) => (
        <View
          key={service.id}
          style={[styles.serviceItem, index < services.length - 1 && styles.divider]}
        >
          <View style={styles.bullet} />
          <View style={styles.serviceContent}>
            <Text style={styles.serviceName}>{service.name_ar}</Text>
            {service.description_ar && (
              <Text style={styles.serviceDesc}>{service.description_ar}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'right',
  },
  serviceItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B4332',
    marginTop: 6,
    flexShrink: 0,
  },
  serviceContent: { flex: 1 },
  serviceName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  serviceDesc: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
    marginTop: 2,
  },
});
