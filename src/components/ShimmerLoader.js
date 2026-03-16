import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ShimmerLoader = ({ style, width: w, height: h, borderRadius = 12 }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[styles.container, { width: w, height: h, borderRadius }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#e2e8f0', // Slate 200 (MoveX standard)
        overflow: 'hidden',
    },
});

export default ShimmerLoader;
