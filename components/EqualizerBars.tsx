import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface Props {
  color: string;
  size?: number;
  isPlaying: boolean;
}

export function EqualizerBars({ color, size = 14, isPlaying }: Props) {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.9)).current,
    useRef(new Animated.Value(0.4)).current,
  ];
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();
    if (isPlaying) {
      const durations = [320, 410, 290, 370, 250];
      const initVals = [0.3, 0.7, 0.5, 0.9, 0.4];

      loopRef.current = Animated.loop(
        Animated.parallel(
          bars.map((bar, i) =>
            Animated.sequence([
              Animated.timing(bar, { toValue: 1,           duration: durations[i],           useNativeDriver: true }),
              Animated.timing(bar, { toValue: 0.15,        duration: durations[i] + 80,      useNativeDriver: true }),
              Animated.timing(bar, { toValue: 0.75,        duration: durations[i] - 40,      useNativeDriver: true }),
              Animated.timing(bar, { toValue: initVals[i], duration: durations[i] + 30,      useNativeDriver: true }),
            ])
          )
        )
      );
      loopRef.current.start();
    } else {
      Animated.parallel(
        bars.map(bar => Animated.timing(bar, { toValue: 0.25, duration: 300, useNativeDriver: true }))
      ).start();
    }
    return () => loopRef.current?.stop();
  }, [isPlaying]);

  const barW = Math.max(2, size * 0.14);
  const gap = Math.max(1, size * 0.08);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {bars.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              width: barW,
              backgroundColor: color,
              marginHorizontal: gap / 2,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  bar: { height: "100%", borderRadius: 2 },
});
