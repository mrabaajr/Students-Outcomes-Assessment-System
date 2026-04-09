import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function InfoCard({ children, title, rightText }) {
  return (
    <View style={styles.card}>
      {(title || rightText) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
  },
  rightText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
