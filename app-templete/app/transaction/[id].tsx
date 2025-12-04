import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { transactionService, Transaction as ApiTransaction } from '@/services/transaction.service';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<ApiTransaction | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await transactionService.getTransactionById(id);
        const payload = res?.data?.transaction || res?.data || res?.transaction || res;
        setTx(payload as ApiTransaction);
      } catch (e: any) {
        setError(e?.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const Row = ({ label, value }: { label: string; value?: string | number }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value ?? '—')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0A2540" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#0A2540" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={28} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !tx ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Row label="Type" value={tx.type?.split('_').map(w => w[0].toUpperCase()+w.slice(1)).join(' ')} />
            <Row label="Amount" value={`₦${tx.amount.toLocaleString()}`} />
            <Row label="Fee" value={`₦${(tx.fee ?? 0).toLocaleString()}`} />
            <Row label="Total Charged" value={`₦${tx.total_charged.toLocaleString()}`} />
            <Row label="Status" value={tx.status?.charAt(0).toUpperCase()+tx.status?.slice(1)} />
            <Row label="Reference" value={tx.reference_number} />
            <Row label="Destination" value={tx.destination_account || '—'} />
            <Row label="Payment Method" value={tx.payment_method} />
            <Row label="Plan ID" value={tx.plan_id || '—'} />
            <Row label="Operator" value={tx.operator_id || '—'} />
            <Row label="Created" value={new Date(tx.created_at).toLocaleString()} />
            <Row label="Updated" value={new Date(tx.updated_at).toLocaleString()} />
            {tx.description ? <Row label="Description" value={tx.description} /> : null}
            {tx.error_message ? (
              <View style={[styles.row, { alignItems: 'flex-start' }]}> 
                <Text style={styles.label}>Error</Text>
                <Text style={[styles.value, { color: '#EF4444' }]}>{tx.error_message}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: '700', color: '#0A2540' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#6B7280' },
  errorText: { marginTop: 8, color: '#EF4444', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
  value: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginLeft: 16, flexShrink: 1, textAlign: 'right' },
});
