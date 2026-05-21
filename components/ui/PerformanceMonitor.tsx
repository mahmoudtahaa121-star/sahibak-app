import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { performanceMonitor } from '../../utils/performance';

if (__DEV__) {
  // Make performance monitor available globally for debugging
  (global as any).performanceMonitor = performanceMonitor;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState(performanceMonitor.getSummary());
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!__DEV__ || !isVisible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleText}>⚡</Text>
      </TouchableOpacity>
    );
  }

  const handleClear = () => {
    performanceMonitor.clearMetrics();
    setSummary(performanceMonitor.getSummary());
    setMetrics(performanceMonitor.getMetrics());
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Monitor</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Metrics:</Text>
            <Text style={styles.summaryValue}>{summary.totalMetrics}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Render:</Text>
            <Text style={[styles.summaryValue, summary.averageRenderTime > 16 && styles.warning]}>
              {summary.averageRenderTime.toFixed(2)}ms
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg API:</Text>
            <Text style={[styles.summaryValue, summary.averageApiTime > 1000 && styles.warning]}>
              {summary.averageApiTime.toFixed(2)}ms
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Navigation:</Text>
            <Text style={[styles.summaryValue, summary.averageNavigationTime > 500 && styles.warning]}>
              {summary.averageNavigationTime.toFixed(2)}ms
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Slow Metrics:</Text>
            <Text style={[styles.summaryValue, summary.slowMetrics.length > 0 && styles.warning]}>
              {summary.slowMetrics.length}
            </Text>
          </View>
        </View>

        {summary.slowMetrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Slow Metrics</Text>
            {summary.slowMetrics.map((metric, index) => (
              <View key={index} style={styles.metricItem}>
                <Text style={styles.metricName}>{metric.name}</Text>
                <Text style={styles.metricValue}>{metric.duration.toFixed(2)}ms</Text>
                <Text style={styles.metricType}>{metric.type}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Metrics</Text>
          {metrics.slice(-10).reverse().map((metric, index) => (
            <View key={index} style={styles.metricItem}>
              <Text style={styles.metricName}>{metric.name}</Text>
              <Text style={styles.metricValue}>{metric.duration.toFixed(2)}ms</Text>
              <Text style={styles.metricType}>{metric.type}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1B4332',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  toggleText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1B4332',
    borderRadius: 5,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    color: '#ADB5BD',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    color: '#FF6B6B',
  },
  section: {
    marginBottom: 20,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 5,
    marginBottom: 5,
  },
  metricName: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  metricType: {
    color: '#ADB5BD',
    fontSize: 12,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
});
