import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function ActionCard({ title, description, accent, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderLeftColor: accent }, pressed && styles.cardPressed]}
    >
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={[styles.arrow, { color: accent }]}>View</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 5,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.92,
  },
  title: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  arrow: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 14,
  },
});
