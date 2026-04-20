import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import AppSidebar from "../navigation/AppSidebar";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AppScreen({
  eyebrow,
  title,
  subtitle,
  titleStyle,
  heroFooter,
  showMeta = true,
  enableScrollTopButton = false,
  onRefresh,
  refreshing = false,
  children,
  footer,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const { session, signOut, user } = useAuth();
  const scrollRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const isProgramChair = session.userRole === "admin";
  const showEyebrow = Boolean(
    eyebrow && (isProgramChair || !String(eyebrow).toLowerCase().startsWith("faculty"))
  );

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

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 180,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, [compactHeader]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[0]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.yellow}
              colors={[colors.yellow]}
              progressBackgroundColor={colors.dark}
            />
          ) : undefined
        }
        onScroll={(event) => {
          const y = event.nativeEvent.contentOffset?.y || 0;
          setCompactHeader(y > 40);
          if (!enableScrollTopButton) return;
          setShowScrollTop(y > 260);
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.hero, compactHeader ? styles.heroCompact : null]}>
          {showEyebrow && !compactHeader ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <View style={[styles.titleRow, compactHeader ? styles.titleRowCompact : null]}>
            <Pressable
              onPress={() => setSidebarOpen(true)}
              style={[styles.menuButton, compactHeader ? styles.menuButtonCompact : null]}
              hitSlop={8}
            >
              <Text style={styles.menuIcon}>≡</Text>
            </Pressable>
            <Text
              style={[
                styles.title,
                styles.titleInline,
                compactHeader ? styles.titleInlineCompact : null,
                titleStyle,
              ]}
            >
              {title}
            </Text>
          </View>
          {subtitle && !compactHeader ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {showMeta && user?.email && !compactHeader ? <Text style={styles.meta}>{user.email}</Text> : null}
          {heroFooter && !compactHeader ? <View style={styles.heroFooter}>{heroFooter}</View> : null}
        </View>

        <View style={styles.body}>{children}</View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>

      {enableScrollTopButton && showScrollTop ? (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={styles.scrollTopButton}
        >
          <Text style={styles.scrollTopButtonText}>↑</Text>
        </Pressable>
      ) : null}

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
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroCompact: {
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  titleRowCompact: {
    marginTop: 0,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: colors.darkAlt,
    borderRadius: 999,
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 0,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  title: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  titleInline: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
  },
  titleInlineCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  menuButton: {
    backgroundColor: "rgba(255, 194, 14, 0.16)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  menuButtonCompact: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  menuIcon: {
    color: colors.yellow,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  meta: {
    color: colors.yellow,
    fontSize: 13,
    marginTop: 12,
  },
  heroFooter: {
    marginTop: 14,
  },
  body: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollTopButton: {
    position: "absolute",
    right: 18,
    bottom: 22,
    backgroundColor: colors.yellow,
    borderRadius: 999,
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  scrollTopButtonText: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 24,
  },
});
