import { t } from "i18next";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { useSharedValue} from 'react-native-reanimated';
import { useRouter } from "expo-router";

import { addHomeworkToDatabase } from "@/database/useHomework";
import { generateId } from "@/utils/generateId";
import { useAccountStore } from "@/stores/account";
import Stack from "@/ui/components/Stack";
import Typography from "@/ui/components/Typography";
import { Homework as SharedHomework } from "@/services/shared/homework";
import {
  NativeHeaderSide,
  NativeHeaderTitle,
} from "@/ui/components/NativeHeader";
import { Papicons } from "@getpapillon/papicons";
import NativeHeaderPressable from "@/ui/components/NativeHeaderTopPressable";
import OnboardingInput from "@/components/onboarding/OnboardingInput";
import Calendar from "@/ui/components/Calendar";
import { Check } from "lucide-react-native";

export default function CreateHomework() {
  const { colors } = useTheme();
  const router = useRouter();
  const store = useAccountStore.getState();
  const account = store.accounts.find(account => account.id === store.lastUsedAccount);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [isEvaluation, setIsEvaluation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const checkboxScale = useSharedValue(0);
  const checkboxOpacity = useSharedValue(0);
  const handleDateChange = useCallback((newDate: Date) => {
    setDueDate(newDate);
    setShowDatePicker(false);
  }, []);

  const isFormValid = subject.trim() && content.trim();

  const handleSubmit = async () => {
    if (!subject.trim() || !content.trim()) {
      Alert.alert(t('Tasks_Create_ErrorTitle'), t('Tasks_Create_Required'));
      return;
    }

    if (!account) {
      Alert.alert(t('Tasks_Create_ErrorTitle'), t('Tasks_Create_NoAccount'));
      return;
    }

    setIsLoading(true);

    try {
      const homework: SharedHomework = {
        id: generateId(subject + content + account.id),
        subject: subject.trim(),
        content: content.trim(),
        dueDate: dueDate,
        isDone: false,
        attachments: [],
        evaluation: isEvaluation,
        custom: true,
        createdByAccount: account.id,
        kidName: account.firstName + " " + account.lastName,
      };

      await addHomeworkToDatabase([homework]);

      Alert.alert(t('Tasks_Create_Confirm'), t('Tasks_Create_Success'), [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/tasks"),
        },
      ]);
    } catch (error) {
      console.error("Erreur lors de la création du devoir:", error);
      Alert.alert(
        t('Tasks_Create_ErrorTitle'),
        t('Tasks_Create_Error')
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <NativeHeaderTitle>
        <Typography variant="navigation">{t('Tasks_Create_Title')}</Typography>
      </NativeHeaderTitle>
      <NativeHeaderSide side={"Left"}>
        <NativeHeaderPressable
          onPress={() => router.back()}
        >
          <Papicons name={"Cross"}
            size={25}
          />
        </NativeHeaderPressable>
      </NativeHeaderSide>
      <NativeHeaderSide side={"Right"} key={`submit-${isFormValid}`}
      >
        <NativeHeaderPressable
          onPress={handleSubmit}
          disabled={!isFormValid}
        >
          <Papicons name={"Check"}
            size={25} 
            color={isFormValid ? colors.primary : colors.primary + "7F"}
          />
        </NativeHeaderPressable>
      </NativeHeaderSide>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.containerContent}
          style={styles.container}
        >
          <Stack
            gap={10}
          >
            <Stack gap={5}
                   direction={"horizontal"}
                   hAlign={"center"}
                   style={{ paddingHorizontal: 16, marginTop: 20 }}
            >
              <Papicons name={"Font"}
                        color={colors.text + "7F"}
                        size={18}
              />
              <Typography color="secondary">{t('Tasks_Subject_Label')}</Typography>
            </Stack>
            <Stack style={{ paddingHorizontal: 16 }}>
              <OnboardingInput
                placeholder={t('Tasks_Subject_Placeholder')}
                text={subject}
                setText={setSubject}
                icon="Font"
                inputProps={{}}
              />
            </Stack>
            <Stack gap={5}
                   direction={"horizontal"}
                   hAlign={"center"}
                   style={{ paddingHorizontal: 16, marginTop: 20 }}
            >
              <Papicons name={"Pen"}
                        color={colors.text + "7F"}
                        size={18}
              />
              <Typography color="secondary">{t('Tasks_Content_Label')}</Typography>
            </Stack>
            <Stack style={{ paddingHorizontal: 16 }}>
              <View style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                padding: 20,
                paddingVertical: Platform.OS === "ios" ? 20 : 15,
                backgroundColor: colors.text + "08",
                borderRadius: 30,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 120,
              }}>
                <Papicons name="Pen" color={colors.text + "AF"} size={24} style={{ marginTop: 2 }} />
                <TextInput
                  style={{
                    flex: 1,
                    color: colors.text + "AF",
                    fontFamily: "semibold",
                    fontSize: 19,
                    fontWeight: "600",
                    textAlignVertical: "top",
                    minHeight: 80,
                  }}
                  placeholder={t('Tasks_Content_Placeholder')}
                  placeholderTextColor={colors.text + "60"}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </Stack>
            <Stack gap={5}
                   direction={"horizontal"}
                   hAlign={"center"}
                   style={{ paddingHorizontal: 16, marginTop: 20 }}
            >
              <Papicons name={"Calendar"}
                        color={colors.text + "7F"}
                        size={18}
              />
              <Typography color="secondary">{t('Tasks_DueDate_Label')}</Typography>
            </Stack>
            <Stack style={{ paddingHorizontal: 16 }}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 20,
                  paddingVertical: Platform.OS === "ios" ? 20 : 10,
                  backgroundColor: colors.text + "08",
                  borderRadius: 300,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <Papicons name="Calendar" color={colors.text + "AF"} size={24} />
                <Typography
                  style={{
                    color: colors.text + "AF",
                    fontFamily: "semibold",
                    fontSize: 19,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {dueDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Pressable>
              <Calendar
                key={"calendar-" + dueDate.toISOString()}
                date={dueDate}
                onDateChange={handleDateChange}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
              />
            </Stack>

            <Stack gap={5}
                   direction={"horizontal"}
                   hAlign={"center"}
                   style={{ paddingHorizontal: 16, marginTop: 20 }}
            >
              <Papicons name={"PenAlt"}
                        color={colors.text + "7F"}
                        size={18}
              />
              <Typography color="secondary">{t('Tasks_Type_Label')}</Typography>
            </Stack>
            <Stack style={{ paddingHorizontal: 16}}>
              <Pressable
                onPress={() => setIsEvaluation(!isEvaluation)}
                style={({ pressed }) => ([
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    paddingVertical: 20,
                    paddingHorizontal: 18,
                    backgroundColor: pressed ? colors.text + '10' : colors.text + '08',
                    borderRadius: 30,
                    borderWidth: 1,
                    borderColor: isEvaluation ? colors.primary : colors.border,
                    marginHorizontal: 0,
                  },
                ])}
              >
                <View style={{ flex: 1 }}>
                  <Typography
                    style={{
                      color: colors.text + "AF",
                      fontFamily: "semibold",
                      fontSize: 18,
                    }}
                  >
                    {t('Tasks_Type_Evaluation')}
                  </Typography>
                </View>
                <Animated.View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2.5,
                    borderColor: isEvaluation ? colors.primary : colors.border,
                    backgroundColor: isEvaluation ? colors.primary : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 16,
                  }}
                >
                  {isEvaluation && (
                    <Check color="white" size={18} strokeWidth={3} />
                  )}
                </Animated.View>
              </Pressable>
            </Stack>

          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    justifyContent: "center",
    paddingBottom: 100,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
});