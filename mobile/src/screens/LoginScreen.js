import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { normalizeRole, roleLabel } from "../utils/roles";

export default function LoginScreen() {
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const ctaPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctaAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };

  }, [ctaAnim, ctaPulseAnim, formAnim, heroAnim]);

  const formTranslate = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  });

  const ctaTranslate = ctaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const ctaPulseScale = ctaPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  async function handleLogin() {
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }

    if (!selectedRole) {
      setError("Select a role.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const user = await signIn(email.trim(), password);
      const actualRole = normalizeRole(user?.role);

      if (actualRole !== selectedRole) {
        await signOut();
        throw new Error(
          `This account is ${roleLabel(actualRole)}. Please select the correct role.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroAnim,
              },
            ]}
          >
            <View style={styles.heroOrbOne} />
            <View style={styles.heroOrbTwo} />
            <View style={styles.diagonalStripe} />
            <View style={styles.pulseRing} />
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>Student Outcomes Assessment Portal</Text>
              <Text style={styles.heroTitle}>
                <Text style={styles.heroTitlePrimary}>Welcome </Text>
                <Text style={styles.heroTitleAccent}>back</Text>
              </Text>
              <Text style={styles.heroSubtitle}>Sign in to access your account and continue your journey with us.</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.formArea,
              {
                opacity: formAnim,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Select role</Text>

            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setSelectedRole("admin")}
                style={[
                  styles.roleCard,
                  selectedRole === "admin" ? styles.roleCardActive : null,
                ]}
              >
                <Text style={styles.roleIcon}>◉</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === "admin" ? styles.roleTextActive : null,
                  ]}
                >
                  Program Chair
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedRole("staff")}
                style={[
                  styles.roleCard,
                  selectedRole === "staff" ? styles.roleCardActive : null,
                ]}
              >
                <Text style={styles.roleIcon}>◔</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === "staff" ? styles.roleTextActive : null,
                  ]}
                >
                  Faculty
                </Text>
              </Pressable>
            </View>

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor={colors.gray}
              style={styles.input}
              value={email}
            />

            <View style={styles.passwordWrap}>
              <TextInput
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.gray}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
              />
              <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Animated.View
              style={{
                opacity: ctaAnim,
                transform: [{ translateY: ctaTranslate }, { scale: ctaPulseScale }],
              }}
            >
              <Pressable
                disabled={isSubmitting || !selectedRole}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.button,
                  (pressed && !isSubmitting) || (!selectedRole && styles.buttonDisabled)
                    ? styles.buttonPressed
                    : null,
                  !selectedRole ? styles.buttonDisabled : null,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.dark} />
                ) : (
                  <Text style={styles.buttonText}>
                    Sign in as {selectedRole === "admin" ? "Program Chair" : selectedRole === "staff" ? "Faculty" : "..."}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  hero: {
    backgroundColor: "#000000",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 320,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 44,
  },
  heroOrbOne: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    top: -34,
    right: -30,
    backgroundColor: "rgba(255, 194, 14, 0.18)",
  },
  heroOrbTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    top: 36,
    left: -34,
    backgroundColor: "rgba(255, 194, 14, 0.16)",
  },
  diagonalStripe: {
    position: "absolute",
    top: 10,
    left: -92,
    width: "140%",
    height: 78,
    backgroundColor: "rgba(255, 194, 14, 0.88)",
    transform: [{ rotate: "-20deg" }],
  },
  pulseRing: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.32)",
    right: 10,
    bottom: 16,
  },
  heroContent: {
    marginTop: 112,
  },
  heroEyebrow: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: -14,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 54,
    marginTop: 0,
    textAlign: "left",
    textTransform: "capitalize",
  },
  heroTitlePrimary: {
    color: colors.surface,
  },
  heroTitleAccent: {
    color: colors.yellow,
  },
  heroSubtitle: {
    color: "#E5E7EB",
    fontSize: 17,
    lineHeight: 24,
    marginTop: 28,
    maxWidth: 290,
  },
  formArea: {
    backgroundColor: colors.surface,
    borderColor: "#E6EAF2",
    borderRadius: 22,
    borderWidth: 1,
    marginHorizontal: 14,
    marginTop: 50,
    flex: 1,
    minHeight: 460,
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 24,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  errorBanner: {
    backgroundColor: "#FFF8E1",
    borderColor: "rgba(255, 194, 14, 0.45)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: colors.dark,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 20,
  },
  roleCardActive: {
    backgroundColor: "#FFF8E1",
    borderColor: colors.yellow,
  },
  roleIcon: {
    color: colors.yellowAlt,
    fontSize: 18,
    marginBottom: 8,
  },
  roleText: {
    color: colors.darkAlt,
    fontSize: 13,
    fontWeight: "600",
  },
  roleTextActive: {
    color: colors.dark,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  passwordWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    paddingRight: 12,
  },
  passwordInput: {
    color: colors.dark,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  eyeButton: {
    paddingVertical: 6,
  },
  eyeText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    color: colors.yellowAlt,
    fontSize: 13,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingVertical: 17,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
  },
});
