import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";

const iconMap = {
  dashboard: "▦",
  analytics: "◫",
  "menu-book": "▤",
  assignment: "▣",
  description: "▥",
  groups: "◔",
  settings: "⚙",
  logout: "↪",
};

export default function AppSidebar({
  email,
  items,
  onClose,
  onLogout,
  onNavigate,
}) {
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.brand}>SO Assessment</Text>
          <Text style={styles.email}>{email || "Signed in"}</Text>
        </View>

        <View style={styles.body}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => onNavigate(item.route)}
              style={({ pressed }) => [
                styles.link,
                item.active ? styles.linkActive : null,
                pressed ? styles.linkPressed : null,
              ]}
            >
              <Text style={[styles.icon, item.active ? styles.iconActive : null]}>
                {iconMap[item.icon] || "•"}
              </Text>
              <Text style={[styles.linkText, item.active ? styles.linkTextActive : null]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onLogout} style={({ pressed }) => [styles.logout, pressed && styles.linkPressed]}>
          <Text style={styles.icon}>{iconMap.logout}</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 50,
  },
  scrim: {
    backgroundColor: "rgba(0,0,0,0.35)",
    flex: 1,
  },
  panel: {
    backgroundColor: "#efeff7",
    borderBottomRightRadius: 18,
    borderTopRightRadius: 18,
    maxWidth: 340,
    width: "86%",
  },
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  brand: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "800",
  },
  email: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  body: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  link: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  linkActive: {
    backgroundColor: "#d9ddf5",
  },
  linkPressed: {
    opacity: 0.8,
  },
  linkText: {
    color: "#5f6368",
    fontSize: 17,
    fontWeight: "500",
  },
  linkTextActive: {
    color: colors.dark,
    fontWeight: "700",
  },
  icon: {
    color: "#5f6368",
    fontSize: 20,
    width: 22,
  },
  iconActive: {
    color: colors.dark,
  },
  logout: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 28,
    paddingVertical: 22,
  },
  logoutText: {
    color: "#5f6368",
    fontSize: 17,
    fontWeight: "500",
  },
});
