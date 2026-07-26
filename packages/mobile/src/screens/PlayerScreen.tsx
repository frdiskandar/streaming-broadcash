import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Video from "react-native-video";
import { useWebSocket } from "../hooks/useWebSocket";
import { HTTP_FLV_PORT } from "../config";

export default function PlayerScreen() {
  const [serverHost, setServerHost] = useState("");
  const [streamKey, setStreamKey] = useState("live");
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);

  const {
    viewerCount,
    isConnected,
    streamLive,
    adminVolume,
    sendVolume,
  } = useWebSocket({
    serverHost: connected ? serverHost : "",
    streamKey: connected ? streamKey : "",
    username: "mobile-viewer",
  });

  useEffect(() => {
    if (adminVolume !== null) {
      setVolume(adminVolume);
      setMuted(adminVolume === 0);
    }
  }, [adminVolume]);

  const hlsUrl =
    connected && serverHost
      ? `http://${serverHost}:${HTTP_FLV_PORT}/live/${streamKey}.m3u8`
      : "";

  const handleConnect = useCallback(() => {
    if (!serverHost.trim()) return;
    setConnected(true);
  }, [serverHost]);

  const handleDisconnect = useCallback(() => {
    setConnected(false);
  }, []);

  const handleVolumeChange = useCallback(
    (val: number) => {
      setVolume(val);
      setMuted(val === 0);
      sendVolume(val);
    },
    [sendVolume]
  );

  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    sendVolume(newMuted ? 0 : volume);
  }, [muted, volume, sendVolume]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Broadcast Viewer</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Server IP</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.100"
          placeholderTextColor="#52525b"
          value={serverHost}
          onChangeText={setServerHost}
          editable={!connected}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Stream Key</Text>
        <TextInput
          style={styles.input}
          placeholder="live"
          placeholderTextColor="#52525b"
          value={streamKey}
          onChangeText={setStreamKey}
          editable={!connected}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, connected && styles.buttonDisconnect]}
          onPress={connected ? handleDisconnect : handleConnect}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {connected ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>

      {connected && (
        <View style={styles.playerSection}>
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: hlsUrl }}
              style={styles.video}
              resizeMode="contain"
              muted={muted}
              volume={volume / 100}
              paused={!streamLive}
              repeat={false}
              onError={() => {}}
            />

            <View style={styles.statusOverlay}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: streamLive
                      ? "#ef4444"
                      : isConnected
                        ? "#eab308"
                        : "#6b7280",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {streamLive ? "LIVE" : "OFFLINE"}
              </Text>
              {viewerCount > 0 && (
                <Text style={styles.viewerText}>
                  {viewerCount} watching
                </Text>
              )}
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.volumeRow}>
              <TouchableOpacity onPress={toggleMute}>
                <Text style={styles.muteIcon}>
                  {muted || volume === 0
                    ? "\u{1F507}"
                    : volume < 50
                      ? "\u{1F509}"
                      : "\u{1F50A}"}
                </Text>
              </TouchableOpacity>

              <View style={styles.sliderContainer}>
                {[0, 25, 50, 75, 100].map((mark) => (
                  <TouchableOpacity
                    key={mark}
                    style={[
                      styles.sliderMark,
                      volume >= mark && styles.sliderMarkActive,
                    ]}
                    onPress={() => handleVolumeChange(mark)}
                  />
                ))}
              </View>

              <Text style={styles.volumePercent}>{volume}%</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fafafa",
  },
  inputSection: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a1a1aa",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#fafafa",
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisconnect: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  playerSection: {
    flex: 1,
    padding: 20,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  statusOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  viewerText: {
    color: "#a1a1aa",
    fontSize: 11,
    marginLeft: 4,
  },
  controls: {
    marginTop: 16,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#18181b",
    padding: 12,
    borderRadius: 8,
  },
  muteIcon: {
    fontSize: 20,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#27272a",
  },
  sliderMarkActive: {
    backgroundColor: "#22c55e",
  },
  volumePercent: {
    color: "#a1a1aa",
    fontSize: 13,
    fontFamily: "monospace",
    minWidth: 40,
    textAlign: "right",
  },
});
