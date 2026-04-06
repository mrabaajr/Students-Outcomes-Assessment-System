import { useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AppSidebar from "../navigation/AppSidebar";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

export default function AppScreen({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const { session, signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isProgramChair = session.userRole === "admin";

  const sidebarItems = useMemo(() => {
    if (isProgramChair) {
      return [
        { label: "Dashboard", route: "ProgramChairDashboard", icon: "dashboard" },
        { label: "Student Outcomes", route: "ProgramChairStudentOutcomes", icon: "analytics" },
        { label: "Courses", route: "ProgramChairCourses", icon: "menu-book" },
        { label: "Assessments", route: "ProgramChairAssessments", icon: "assignment" },
        { label: "Reports", route: "ProgramChairReports", icon: "description" },
        { label: "Classes", route: "ProgramChairClasses", icon: "groups" },
        { label: "Settings", route: "ProgramChairSettings", icon: "settings" },
      ];
    }

    return [
      { label: "Dashboard", route: "FacultyDashboard", icon: "dashboard" },
      { label: "Classes", route: "FacultyClasses", icon: "groups" },
      { label: "Assessments", route: "FacultyAssessments", icon: "assignment" },
      { label: "Reports", route: "FacultyReports", icon: "description" },
      { label: "Settings", route: "FacultySettings", icon: "settings" },
    ];
  }, [isProgramChair]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {sidebarOpen ? (
        <AppSidebar
          email={user?.email}
          items={sidebarItems.map((item) => ({ ...item, active: route.name === item.route }))}
          onClose={() => setSidebarOpen(false)}
          onLogout={async () => {
            setSidebarOpen(false);
            await signOut();
          }}
          onNavigate={(targetRoute) => {
            setSidebarOpen(false);
            if (route.name !== targetRoute) {
              navigation.navigate(targetRoute);
            }
          }}
        />
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Pressable onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <Text style={styles.menuIcon}>≡</Text>
          </Pressable>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {user?.email ? <Text style={styles.meta}>{user.email}</Text> : null}
        </View>

        <View style={styles.body}>{children}</View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: colors.dark,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: colors.darkAlt,
    borderRadius: 999,
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  menuButton: {
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  menuIcon: {
    color: colors.yellow,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.gray,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  meta: {
    color: colors.yellow,
    fontSize: 13,
    marginTop: 12,
  },
  body: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
