import { StyleSheet, Text, View } from "react-native";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { colors } from "../theme/colors";

const iconMap = {
  analytics: "◫",
  assignment: "▣",
  description: "▥",
  settings: "⚙",
  construction: "⌁",
};

export default function PlaceholderScreen({ route }) {
  const { eyebrow, title, subtitle, icon = "construction" } = route.params || {};

  return (
    <AppScreen
      eyebrow={eyebrow || "SO Assessment"}
      title={title || "Coming soon"}
      subtitle={subtitle || "This mobile screen is next in line and will be built out soon."}
    >
      <InfoCard title="Placeholder screen">
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{iconMap[icon] || iconMap.construction}</Text>
          </View>
          <Text style={styles.title}>Structure first, details next</Text>
          <Text style={styles.copy}>
            This route is now wired into the mobile app so navigation feels complete while we
            continue porting the real page from the website.
          </Text>
        </View>
      </InfoCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 24,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 20,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  title: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 18,
  },
  copy: {
    color: colors.gray,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  icon: {
    color: colors.yellow,
    fontSize: 34,
    fontWeight: "700",
  },
});
