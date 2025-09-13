import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { screenOptions } from "@/utils/theme/ScreenOptions";

export default function Layout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: t("Tab_Tasks"),
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          presentation: "modal",
          headerLargeTitle: false,
        }}
      />
      {/*<Stack.Screen*/}
      {/*  name="edit"*/}
      {/*  options={{*/}
      {/*    presentation: "modal",*/}
      {/*    headerLargeTitle: false,*/}
      {/*  }}*/}
      {/*/>*/}
    </Stack>
  );
}
