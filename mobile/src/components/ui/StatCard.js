import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function StatCard({ label, value, sublabel, accent }) {
  return (
    <View style={[styles.card, { borderTopColor: accent }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderTopWidth: 4,
    flex: 1,
    minWidth: "47%",
    padding: 16,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  sublabel: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
