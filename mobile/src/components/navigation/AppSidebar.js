import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay}>
      <View style={[styles.panel, { paddingBottom: Math.max(18, insets.bottom + 10) }]}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>SO</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brand}>SO Assessment</Text>
              <Text style={styles.brandSub}>Student Outcomes System</Text>
            </View>
          </View>
          <Text style={styles.email}>{email || "Signed in"}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Navigation</Text>
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
              <View style={[styles.iconWrap, item.active ? styles.iconWrapActive : null]}>
                <Text style={[styles.icon, item.active ? styles.iconActive : null]}>
                  {iconMap[item.icon] || "•"}
                </Text>
              </View>
              <Text style={[styles.linkText, item.active ? styles.linkTextActive : null]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logout,
            { marginBottom: Math.max(0, insets.bottom) },
            pressed && styles.linkPressed,
          ]}
        >
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{iconMap.logout}</Text>
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
      <Pressable style={styles.scrim} onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 40,
    flexDirection: "row",
    zIndex: 50,
  },
  scrim: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
  },
  panel: {
    backgroundColor: colors.surface,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    borderRightColor: colors.graySoft,
    borderRightWidth: 1,
    elevation: 41,
    justifyContent: "space-between",
    maxWidth: 340,
    width: "86%",
  },
  header: {
    backgroundColor: colors.dark,
    borderBottomRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  brandBadge: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  brandBadgeText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "900",
  },
  brandCopy: {
    flex: 1,
  },
  brand: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "800",
  },
  brandSub: {
    color: "#c7c7c7",
    fontSize: 11,
    marginTop: 2,
  },
  email: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 194, 14, 0.14)",
    borderColor: "rgba(255, 194, 14, 0.3)",
    borderRadius: 999,
    borderWidth: 1,
    color: colors.yellow,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  body: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  sectionLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },
  link: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  linkActive: {
    backgroundColor: "#fff8db",
    borderColor: "#f6d46b",
    borderWidth: 1,
  },
  linkPressed: {
    opacity: 0.86,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  iconWrapActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellowAlt,
  },
  linkText: {
    color: "#5b6168",
    fontSize: 15,
    fontWeight: "600",
  },
  linkTextActive: {
    color: colors.dark,
    fontWeight: "800",
  },
  icon: {
    color: "#5f6368",
    fontSize: 16,
    width: 18,
    textAlign: "center",
  },
  iconActive: {
    color: colors.dark,
  },
  logout: {
    alignItems: "center",
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  logoutText: {
    color: "#5f6368",
    fontSize: 15,
    fontWeight: "700",
  },
});
